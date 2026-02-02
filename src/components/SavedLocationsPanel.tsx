import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchSavedLocations, deleteSavedLocation } from '../services/savedLocations';
import type { SavedLocation } from '../types/database';

interface SavedLocationsPanelProps {
  onSelectLocation: (lat: number, lng: number, tideStationId: string | null, name: string) => void;
  onOpenAuth: () => void;
  onOpenUpgrade: () => void;
  refreshKey: number;
}

export default function SavedLocationsPanel({
  onSelectLocation,
  onOpenAuth,
  onOpenUpgrade,
  refreshKey,
}: SavedLocationsPanelProps) {
  const { user, canSaveLocations, isConfigured } = useAuth();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !canSaveLocations) {
      setLocations([]);
      return;
    }

    setIsLoading(true);
    fetchSavedLocations(user.id)
      .then(setLocations)
      .finally(() => setIsLoading(false));
  }, [user, canSaveLocations, refreshKey]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSavedLocation(id);
      setLocations(prev => prev.filter(loc => loc.id !== id));
    } catch {
      // Error logged in service
    }
    setConfirmDeleteId(null);
  };

  // Not configured or not logged in
  if (!isConfigured || !user) {
    return (
      <div className="saved-locations-panel">
        <button
          className="saved-locations-cta"
          onClick={onOpenAuth}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Sign up to save locations
        </button>
      </div>
    );
  }

  // Logged in but not paid
  if (!canSaveLocations) {
    return (
      <div className="saved-locations-panel">
        <button
          className="saved-locations-cta"
          onClick={onOpenUpgrade}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Upgrade to save locations
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="saved-locations-panel">
        <div className="saved-locations-loading">Loading...</div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="saved-locations-panel">
        <div className="saved-locations-empty">
          No saved locations yet
        </div>
      </div>
    );
  }

  return (
    <div className="saved-locations-panel">
      {locations.map(loc => (
        <div key={loc.id} className="saved-location-item">
          {confirmDeleteId === loc.id ? (
            <div className="saved-location-confirm-delete">
              <span>Delete?</span>
              <button onClick={() => handleDelete(loc.id)} className="saved-location-confirm-yes">Yes</button>
              <button onClick={() => setConfirmDeleteId(null)} className="saved-location-confirm-no">No</button>
            </div>
          ) : (
            <>
              <button
                className="saved-location-name"
                onClick={() => onSelectLocation(loc.latitude, loc.longitude, loc.tide_station_id, loc.name)}
              >
                {loc.is_default && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
                <span>{loc.name}</span>
              </button>
              <button
                className="saved-location-delete"
                onClick={() => setConfirmDeleteId(loc.id)}
                aria-label="Delete location"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
