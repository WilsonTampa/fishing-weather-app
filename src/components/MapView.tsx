import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Location } from '../types';
import TideStationSelector from './TideStationSelector';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  onLocationSelect: (location: Location) => void;
}

function LocationMarker({ onLocationClick }: { onLocationClick: (location: Location) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);

      // Select location
      onLocationClick({
        latitude: lat,
        longitude: lng,
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      });
    }
  });

  // Try to get user's current location
  useEffect(() => {
    map.locate();
  }, [map]);

  useMapEvents({
    locationfound(e) {
      map.flyTo(e.latlng, 10);
    }
  });

  return position === null ? null : (
    <Marker position={position}>
    </Marker>
  );
}

function MapView({ onLocationSelect }: MapViewProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);
  const [showStationSelector, setShowStationSelector] = useState(false);

  const handleLocationClick = (location: Location) => {
    setPendingLocation(location);
    setShowStationSelector(true);
  };

  const handleStationSelect = (stationId: string) => {
    if (pendingLocation) {
      onLocationSelect({
        ...pendingLocation,
        tideStationId: stationId
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          handleLocationClick({
            latitude: lat,
            longitude: lng,
            name: 'Current Location'
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please click on the map to select a location.');
        }
      );
    }
  };

  // Default center: Tampa Bay, FL (US coastal area)
  const defaultCenter: [number, number] = [27.7676, -82.6403];
  const center = userLocation || defaultCenter;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%'
    }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '1.5rem' }}>Tides & Weather</h1>
        <button
          onClick={handleGetCurrentLocation}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          📍 Use Current Location
        </button>
      </header>

      {/* Instructions */}
      <div style={{
        padding: '1rem 2rem',
        backgroundColor: 'var(--color-background)',
        borderBottom: '1px solid var(--color-border)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Click anywhere on the map to select a location for weather and tide forecasts
        </p>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationClick={handleLocationClick} />
        </MapContainer>
      </div>

      {/* Tide Station Selector Modal */}
      {showStationSelector && pendingLocation && (
        <TideStationSelector
          userLat={pendingLocation.latitude}
          userLng={pendingLocation.longitude}
          onSelect={handleStationSelect}
          onClose={() => {
            setShowStationSelector(false);
            setPendingLocation(null);
          }}
        />
      )}
    </div>
  );
}

export default MapView;
