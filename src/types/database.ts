import type { DashboardLayout } from './dashboard';

// Subscription types
export type SubscriptionTier = 'free' | 'trial' | 'paid';
export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'canceled' | 'past_due';

// Database row types
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  dashboard_layout: DashboardLayout | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedLocation {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  tide_station_id: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Supabase Database type for typed client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>;
      };
      saved_locations: {
        Row: SavedLocation;
        Insert: Omit<SavedLocation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SavedLocation, 'id' | 'user_id' | 'created_at'>>;
      };
    };
  };
}
