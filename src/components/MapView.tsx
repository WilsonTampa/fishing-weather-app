import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Location } from '../types';
import TideStationSelector from './TideStationSelector';
import { useAuth } from '../contexts/AuthContext';
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
  onLocationSelect: (location: Location, promptSave?: boolean) => void;
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
  const { user, canSaveMoreLocations } = useAuth();

  const handleLocationClick = (location: Location) => {
    setPendingLocation(location);
    setShowStationSelector(true);
  };

  const handleStationSelect = (stationId: string, stationName: string) => {
    if (pendingLocation) {
      const locationWithStation: Location = {
        ...pendingLocation,
        tideStationId: stationId,
        name: stationName
      };

      setShowStationSelector(false);
      setPendingLocation(null);

      // Logged-in users with save capacity: persist and prompt to save to DB
      // Everyone else (guests, free users at limit): use temporary location
      const shouldPersist = !!user && canSaveMoreLocations;
      onLocationSelect(locationWithStation, shouldPersist);
    }
  };

  const handleStationSelectorClose = () => {
    setShowStationSelector(false);
    setPendingLocation(null);
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
        <h1 style={{ fontSize: '1.5rem' }}>My Marine Forecast</h1>
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
          Click anywhere on the map to get marine conditions, tide predictions, and offshore weather forecasts
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
            attribution='Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
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
          onClose={handleStationSelectorClose}
        />
      )}
    </div>
  );
}

export default MapView;
