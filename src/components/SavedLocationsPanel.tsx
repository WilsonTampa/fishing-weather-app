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
  const { user, canSaveLocations, canSaveMoreLocations, setSavedLocationCount, isConfigured } = useAuth();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !canSaveLocations) {
      setLocations([]);
      setSavedLocationCount(0);
      return;
    }

    setIsLoading(true);
    fetchSavedLocations(user.id)
      .then(locs => {
        setLocations(locs);
        setSavedLocationCount(locs.length);
      })
      .finally(() => setIsLoading(false));
  }, [user, canSaveLocations, refreshKey, setSavedLocationCount]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSavedLocation(id);
      setLocations(prev => {
        const updated = prev.filter(loc => loc.id !== id);
        setSavedLocationCount(updated.length);
        return updated;
      });
    } catch {
      // Error logged in service
    }
    setConfirmDeleteId(null);
  };

  // Not configured or not logged in — prompt to create account
  if (!isConfigured || !user) {
    return (
      <div className="saved-locations-panel">
        <button
          className="saved-locations-cta"
          onClick={onOpenAuth}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create free account to save locations
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

      {/* Show upgrade CTA for free users who have reached their 1-location limit */}
      {!canSaveMoreLocations && (
        <button
          className="saved-locations-cta"
          onClick={onOpenUpgrade}
          style={{ marginTop: '0.25rem' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Upgrade for unlimited locations
        </button>
      )}
    </div>
  );
}
