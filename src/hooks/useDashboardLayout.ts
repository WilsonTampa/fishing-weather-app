import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDashboardLayout, saveDashboardLayout } from '../services/dashboardLayout';
import { DEFAULT_LAYOUT } from '../types/dashboard';
import type { DashboardLayout, CardId } from '../types/dashboard';

export function useDashboardLayout() {
  const { user, canCustomizeDashboard } = useAuth();
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLayoutLoaded, setIsLayoutLoaded] = useState(false);
  const layoutBeforeEditRef = useRef<DashboardLayout>(DEFAULT_LAYOUT);

  // Load layout from Supabase on mount (paid users only)
  useEffect(() => {
    if (user && canCustomizeDashboard) {
      fetchDashboardLayout(user.id).then((saved) => {
        setLayout(saved);
        setIsLayoutLoaded(true);
      });
    } else {
      setLayout(DEFAULT_LAYOUT);
      setIsLayoutLoaded(true);
    }
  }, [user, canCustomizeDashboard]);

  // Reorder cards after drag end
  const reorderCards = useCallback((activeId: CardId, overId: CardId) => {
    setLayout(prev => {
      const cards = [...prev.cards];
      const oldIndex = cards.findIndex(c => c.id === activeId);
      const newIndex = cards.findIndex(c => c.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const [removed] = cards.splice(oldIndex, 1);
      cards.splice(newIndex, 0, removed);
      return { cards };
    });
  }, []);

  // Toggle collapse state for a card
  const toggleCollapse = useCallback((cardId: CardId) => {
    setLayout(prev => ({
      cards: prev.cards.map(c =>
        c.id === cardId ? { ...c, collapsed: !c.collapsed } : c
      ),
    }));
  }, []);

  // Enter edit mode — snapshot current layout for potential discard
  const enterEditMode = useCallback(() => {
    layoutBeforeEditRef.current = JSON.parse(JSON.stringify(layout));
    setIsEditMode(true);
  }, [layout]);

  // Exit edit mode and persist (paid users)
  const saveAndExit = useCallback(async () => {
    setIsEditMode(false);
    if (user && canCustomizeDashboard) {
      await saveDashboardLayout(user.id, layout);
    }
  }, [user, canCustomizeDashboard, layout]);

  // Discard changes and exit edit mode
  const discardAndExit = useCallback(() => {
    setLayout(layoutBeforeEditRef.current);
    setIsEditMode(false);
  }, []);

  return {
    layout,
    isEditMode,
    isLayoutLoaded,
    enterEditMode,
    saveAndExit,
    discardAndExit,
    reorderCards,
    toggleCollapse,
  };
}
