import { useState, useEffect } from 'react';
import { fetchNearbyTideStations } from '../services/noaaApi';
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
  /** When set, this station is shown highlighted at the top of the modal */
  focusedStation?: { id: string; name: string; lat: number; lng: number };
  onSelect: (stationId: string, stationName: string) => void;
  onClose: () => void;
}

export default function TideStationSelector({
  userLat,
  userLng,
  currentStationId,
  focusedStation,
  onSelect,
  onClose
}: TideStationSelectorProps) {
  const [stations, setStations] = useState<TideStation[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    focusedStation?.id || currentStationId
  );
  const [isLoading, setIsLoading] = useState(true);

  // When a focused station is provided, load nearby stations relative to it
  const searchLat = focusedStation?.lat ?? userLat;
  const searchLng = focusedStation?.lng ?? userLng;

  useEffect(() => {
    const loadStations = async () => {
      setIsLoading(true);
      try {
        const nearby = await fetchNearbyTideStations(searchLat, searchLng, 80.47);
        setStations(nearby);

        if (!focusedStation && !currentStationId && nearby.length > 0) {
          setSelectedId(nearby[0].id);
        }
      } catch (error) {
        console.error('Error loading tide stations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStations();
  }, [searchLat, searchLng, currentStationId, focusedStation]);

  const handleConfirm = () => {
    if (selectedId) {
      const selectedStation = stations.find(s => s.id === selectedId);
      const stationName = selectedStation?.name || focusedStation?.name || 'Unknown Station';
      onSelect(selectedId, stationName);
    }
  };

  // Separate the focused station from the nearby list
  const nearbyStations = focusedStation
    ? stations.filter(s => s.id !== focusedStation.id)
    : stations;

  const focusedStationData = focusedStation
    ? stations.find(s => s.id === focusedStation.id) || {
        id: focusedStation.id,
        name: focusedStation.name,
        lat: focusedStation.lat,
        lng: focusedStation.lng,
        distance: 0,
      }
    : null;

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
            <>
              {/* Focused station from marker click */}
              {focusedStationData && (
                <div className="focused-station-section">
                  <div
                    className={`station-item focused ${selectedId === focusedStationData.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(focusedStationData.id)}
                  >
                    <div className="station-info">
                      <div className="station-name">{focusedStationData.name}</div>
                      <div className="station-distance">
                        {focusedStationData.distance > 0
                          ? `${(focusedStationData.distance * 0.621371).toFixed(1)} miles away`
                          : 'Selected station'}
                      </div>
                    </div>
                    <div className="station-radio">
                      {selectedId === focusedStationData.id && (
                        <div className="radio-selected"></div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Nearby stations section */}
              {nearbyStations.length > 0 && (
                <div className="nearby-stations-section">
                  {focusedStation && (
                    <h3 className="nearby-stations-heading">Nearby Tide Stations</h3>
                  )}
                  <div className="station-list">
                    {nearbyStations.map((station) => (
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
                </div>
              )}
            </>
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
