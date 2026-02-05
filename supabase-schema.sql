-- MyMarineForecast.com Freemium Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'free', -- 'free', 'trial', 'active', 'canceled', 'past_due'
  tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'trial', 'paid'
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- SAVED LOCATIONS TABLE (for paid users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  tide_station_id TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Saved locations policies
-- Allow users to read and delete their own locations
DROP POLICY IF EXISTS "Users can manage own locations" ON public.saved_locations;
CREATE POLICY "Users can manage own locations" ON public.saved_locations
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Enforce saved location limits by tier
-- Free users: max 1 location. Trial/Paid: unlimited.
-- Called by a trigger BEFORE INSERT on saved_locations.
-- ============================================
CREATE OR REPLACE FUNCTION public.enforce_saved_location_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_tier TEXT;
  user_trial_ends TIMESTAMPTZ;
  location_count INT;
BEGIN
  -- Get the user's subscription tier
  SELECT tier, trial_ends_at INTO user_tier, user_trial_ends
  FROM public.subscriptions
  WHERE user_id = NEW.user_id;

  -- If trial tier, check if trial has actually expired
  IF user_tier = 'trial' AND user_trial_ends IS NOT NULL AND user_trial_ends < NOW() THEN
    user_tier := 'free';
  END IF;

  -- Trial and paid users have no limit
  IF user_tier IN ('trial', 'paid') THEN
    RETURN NEW;
  END IF;

  -- Free tier: check current count
  SELECT COUNT(*) INTO location_count
  FROM public.saved_locations
  WHERE user_id = NEW.user_id;

  IF location_count >= 1 THEN
    RAISE EXCEPTION 'Free tier users can save a maximum of 1 location. Upgrade to save more.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_saved_location_limit ON public.saved_locations;
CREATE TRIGGER check_saved_location_limit
  BEFORE INSERT ON public.saved_locations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_saved_location_limit();

-- ============================================
-- TRIGGER: Auto-create profile & subscription on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create subscription with free tier (no trial - trial starts on explicit upgrade)
  INSERT INTO public.subscriptions (user_id, status, tier)
  VALUES (
    NEW.id,
    'free',
    'free'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON public.saved_locations(user_id);

-- ============================================
-- GRANT permissions to authenticated users
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.saved_locations TO authenticated;
