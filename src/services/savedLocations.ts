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
