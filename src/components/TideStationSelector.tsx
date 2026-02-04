import { useState, useEffect } from 'react';
import { fetchNearbyTideStations } from '../services/noaaApi';
import { useAuth } from '../contexts/AuthContext';
import './TideStationSelector.css';

interface TideStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
}

interface TideStationSelectorProps {
  userLat: number;
  userLng: number;
  currentStationId?: string;
  onSelect: (stationId: string, stationName: string) => void;
  onClose: () => void;
  onUpgrade?: () => void;
}

export default function TideStationSelector({
  userLat,
  userLng,
  currentStationId,
  onSelect,
  onClose,
  onUpgrade
}: TideStationSelectorProps) {
  const [stations, setStations] = useState<TideStation[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(currentStationId);
  const [isLoading, setIsLoading] = useState(true);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const { canSaveLocations } = useAuth();

  useEffect(() => {
    const loadStations = async () => {
      setIsLoading(true);
      try {
        // Find all tide stations within 50 miles (80.47 km)
        const nearby = await fetchNearbyTideStations(userLat, userLng, 80.47);
        setStations(nearby);

        // If no current station, select the nearest one
        if (!currentStationId && nearby.length > 0) {
          setSelectedId(nearby[0].id);
        }
      } catch (error) {
        console.error('Error loading tide stations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStations();
  }, [userLat, userLng, currentStationId]);

  const handleConfirm = () => {
    if (selectedId) {
      const selectedStation = stations.find(s => s.id === selectedId);
      const stationName = selectedStation?.name || 'Unknown Station';
      onSelect(selectedId, stationName);
    }

    // Show save prompt for non-paid users
    // For paid users, MapView handles navigation directly in onSelect
    if (!canSaveLocations) {
      setShowSavePrompt(true);
    }
    // Note: We don't call onClose() for paid users here anymore
    // MapView.handleStationSelect handles the navigation directly for paid users
  };

  const handleMaybeLater = () => {
    setShowSavePrompt(false);
    onClose();
  };

  const handleUpgrade = () => {
    setShowSavePrompt(false);
    if (onUpgrade) {
      onUpgrade();
    } else {
      onClose();
    }
  };

  // Save location upsell prompt
  if (showSavePrompt) {
    return (
      <div className="tide-station-modal-overlay" onClick={handleMaybeLater}>
        <div className="tide-station-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
          <div className="tide-station-modal-header">
            <h2>Save This Location?</h2>
            <button className="close-button" onClick={handleMaybeLater}>
              &times;
            </button>
          </div>

          <div className="tide-station-modal-body">
            <div className="save-prompt-content">
              <div className="save-prompt-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <p className="save-prompt-text">
                Save your favorite locations for quick access. Switch between saved spots instantly with one click.
              </p>
              <ul className="save-prompt-features">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Save unlimited locations
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Switch locations instantly
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  7-day extended forecast
                </li>
              </ul>
            </div>
          </div>

          <div className="tide-station-modal-footer save-prompt-footer">
            <button className="cancel-button" onClick={handleMaybeLater}>
              Maybe Later
            </button>
            <button className="confirm-button" onClick={handleUpgrade}>
              Upgrade
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tide-station-modal-overlay" onClick={onClose}>
      <div className="tide-station-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tide-station-modal-header">
          <h2>Select Tide Station</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="tide-station-modal-body">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" />
              <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
                Loading tide stations...
              </p>
            </div>
          ) : stations.length === 0 ? (
            <p className="no-stations-message">
              No tide stations found within 50 miles of your location.
            </p>
          ) : (
            <div className="station-list">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className={`station-item ${selectedId === station.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(station.id)}
                >
                  <div className="station-info">
                    <div className="station-name">{station.name}</div>
                    <div className="station-distance">
                      {(station.distance * 0.621371).toFixed(1)} miles away
                    </div>
                  </div>
                  <div className="station-radio">
                    {selectedId === station.id && (
                      <div className="radio-selected"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tide-station-modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={!selectedId}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
