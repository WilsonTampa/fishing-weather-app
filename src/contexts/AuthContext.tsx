import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile, Subscription, SubscriptionTier } from '../types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isConfigured: boolean;
  tier: SubscriptionTier;
  canAccessFutureDays: boolean;
  canSaveLocations: boolean;
  canCustomizeDashboard: boolean;
  daysRemaining: number | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile and subscription from database
  const fetchUserData = async (userId: string) => {
    if (!supabase) return;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileData) setProfile(profileData as Profile);
      if (subscriptionData) setSubscription(subscriptionData as Subscription);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    // IMPORTANT: Keep this callback synchronous to avoid deadlocks
    // Using async/await inside onAuthStateChange causes the auth client to hang
    // See: https://github.com/supabase/auth-js/issues/762
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Synchronously update session and user state
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer async operations using setTimeout to avoid deadlock
          // This releases the auth client's internal lock before we make more API calls
          setTimeout(() => {
            fetchUserData(session.user.id).finally(() => {
              setIsLoading(false);
            });
          }, 0);
        } else {
          setProfile(null);
          setSubscription(null);
          setIsLoading(false);
        }
      }
    );

    return () => authSubscription.unsubscribe();
  }, []);

  // Compute subscription tier based on subscription status and dates
  const computeTier = (): SubscriptionTier => {
    if (!subscription) return 'free';

    // Check if trial is active
    if (subscription.tier === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      if (trialEnd > new Date()) {
        return 'trial';
      }
      // Trial expired
      return 'free';
    }

    // Check if paid subscription is active
    if (subscription.status === 'active') return 'paid';

    // Past due still gets access during grace period
    if (subscription.status === 'past_due') return 'paid';

    return 'free';
  };

  const tier = computeTier();
  const canAccessFutureDays = tier === 'trial' || tier === 'paid';
  const canSaveLocations = tier === 'paid';
  const canCustomizeDashboard = tier === 'paid';

  // Calculate days remaining in trial
  const daysRemaining = subscription?.trial_ends_at && tier === 'trial'
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Auth not configured');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/forecast`
      }
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };

    try {
      // Add timeout to prevent indefinite hanging
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Sign in timeout - please try again')), 15000)
      );

      const { error } = await Promise.race([signInPromise, timeoutPromise]);
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Auth not configured') };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/forecast`
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (!supabase) return;

    // Clear local state first for immediate UI feedback
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);

    try {
      // Use Promise.race to avoid hanging if signOut takes too long
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SignOut timeout')), 5000)
      );

      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (err) {
      // Log timeout but continue - local state is already cleared
      console.warn('signOut timeout or error:', err);

      // Clear Supabase's localStorage session manually if API times out
      // This ensures session doesn't persist on page refresh
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (supabaseUrl) {
          const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
          if (projectRef) {
            localStorage.removeItem(`sb-${projectRef}-auth-token`);
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  };

  const refreshSubscription = async () => {
    if (!supabase || !user) return;

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) setSubscription(data);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      subscription,
      isLoading,
      isConfigured: isSupabaseConfigured,
      tier,
      canAccessFutureDays,
      canSaveLocations,
      canCustomizeDashboard,
      daysRemaining,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refreshSubscription
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
