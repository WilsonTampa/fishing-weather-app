import { supabase } from '../lib/supabase';
import type { SavedLocation } from '../types/database';

export async function fetchSavedLocations(userId: string): Promise<SavedLocation[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('saved_locations')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching saved locations:', error);
    return [];
  }

  return (data ?? []) as unknown as SavedLocation[];
}

export async function createSavedLocation(
  userId: string,
  name: string,
  latitude: number,
  longitude: number,
  tideStationId: string | null,
  isDefault: boolean = false
): Promise<SavedLocation | null> {
  if (!supabase) return null;

  // Application-level tier check (database trigger also enforces this)
  const { data: sub } = await (supabase
    .from('subscriptions') as any)
    .select('tier, trial_ends_at')
    .eq('user_id', userId)
    .single() as { data: { tier: string; trial_ends_at: string | null } | null };

  const tier = sub?.tier ?? 'free';
  const trialExpired = tier === 'trial' && sub?.trial_ends_at && new Date(sub.trial_ends_at) < new Date();
  const effectiveTier = trialExpired ? 'free' : tier;

  if (effectiveTier === 'free') {
    // Count existing locations for this user
    const { count } = await supabase
      .from('saved_locations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count !== null && count >= 1) {
      throw new Error('Free tier users can save a maximum of 1 location. Upgrade to save more.');
    }
  }

  // If setting as default, clear existing defaults first
  if (isDefault) {
    await (supabase
      .from('saved_locations') as any)
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  const { data, error } = await (supabase
    .from('saved_locations') as any)
    .insert({
      user_id: userId,
      name,
      latitude,
      longitude,
      tide_station_id: tideStationId,
      is_default: isDefault,
    })
    .select()
    .single();

  if (error) {
    // Provide a user-friendly message if the DB trigger catches a limit violation
    if (error.code === 'P0001' || error.message?.includes('maximum of 1 location')) {
      throw new Error('Free tier users can save a maximum of 1 location. Upgrade to save more.');
    }
    console.error('Error saving location:', error);
    throw error;
  }

  return data as SavedLocation;
}

export async function deleteSavedLocation(locationId: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('saved_locations')
    .delete()
    .eq('id', locationId);

  if (error) {
    console.error('Error deleting saved location:', error);
    throw error;
  }
}
