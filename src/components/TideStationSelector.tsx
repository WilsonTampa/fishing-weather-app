import { useState, useEffect } from 'react';
import { findNearbyTideStations } from '../services/noaaApi';
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
  onSelect: (stationId: string) => void;
  onClose: () => void;
}

export default function TideStationSelector({
  userLat,
  userLng,
  currentStationId,
  onSelect,
  onClose
}: TideStationSelectorProps) {
  const [stations, setStations] = useState<TideStation[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(currentStationId);

  useEffect(() => {
    // Find all tide stations within 50 miles (80.47 km)
    const nearby = findNearbyTideStations(userLat, userLng, 80.47);
    setStations(nearby);

    // If no current station, select the nearest one
    if (!currentStationId && nearby.length > 0) {
      setSelectedId(nearby[0].id);
    }
  }, [userLat, userLng, currentStationId]);

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
    onClose();
  };

  return (
    <div className="tide-station-modal-overlay" onClick={onClose}>
      <div className="tide-station-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tide-station-modal-header">
          <h2>Select Tide Station</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="tide-station-modal-body">
          {stations.length === 0 ? (
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
