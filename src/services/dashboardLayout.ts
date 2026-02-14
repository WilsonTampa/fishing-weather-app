import { supabase } from '../lib/supabase';
import type { DashboardLayout } from '../types/dashboard';
import { DEFAULT_LAYOUT } from '../types/dashboard';

export async function fetchDashboardLayout(userId: string): Promise<DashboardLayout> {
  if (!supabase) return DEFAULT_LAYOUT;

  const { data, error } = await (supabase
    .from('profiles') as any)
    .select('dashboard_layout')
    .eq('id', userId)
    .single();

  if (error || !data?.dashboard_layout) {
    return DEFAULT_LAYOUT;
  }

  const saved = data.dashboard_layout as DashboardLayout;

  // Migration: replace legacy combined 'sunmoonfeeding' card with separate 'sunmoon' + 'feeding'
  const hasCombined = saved.cards.some(c => c.id === 'sunmoonfeeding');
  const hasSunmoon = saved.cards.some(c => c.id === 'sunmoon');
  const hasFeeding = saved.cards.some(c => c.id === 'feeding');

  if (hasCombined && !hasSunmoon && !hasFeeding) {
    const combinedIndex = saved.cards.findIndex(c => c.id === 'sunmoonfeeding');
    const sunmoonCard = { id: 'sunmoon' as const, title: 'Sun & Moon', collapsed: false };
    const feedingCard = { id: 'feeding' as const, title: 'Major & Minor Feeding Times', collapsed: false };

    // Remove the combined card and insert both separate cards at its position
    saved.cards.splice(combinedIndex, 1, sunmoonCard, feedingCard);
  }

  // Forward-compatibility: append any new cards from DEFAULT_LAYOUT that aren't in saved
  const savedIds = new Set(saved.cards.map(c => c.id));
  const missingCards = DEFAULT_LAYOUT.cards.filter(c => !savedIds.has(c.id));
  if (missingCards.length > 0) {
    saved.cards = [...saved.cards, ...missingCards];
  }

  return saved;
}

export async function saveDashboardLayout(
  userId: string,
  layout: DashboardLayout
): Promise<void> {
  if (!supabase) return;

  const { error } = await (supabase.from('profiles') as any)
    .update({ dashboard_layout: layout })
    .eq('id', userId);

  if (error) {
    console.error('Error saving dashboard layout:', error);
    throw error;
  }
}
