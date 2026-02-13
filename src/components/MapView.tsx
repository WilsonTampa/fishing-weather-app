import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Location } from '../types';
import TideStationSelector from './TideStationSelector';
import TideStationMarkers from './TideStationMarkers';
import MapOnboarding from './MapOnboarding';
import { useAuth } from '../contexts/AuthContext';
import 'leaflet/dist/leaflet.css';
import './TideStationMarkers.css';

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
  onCancel?: () => void;
}

// Dismiss onboarding on any map interaction (click, scroll, zoom, drag)
function MapInteractionListener({ onInteraction }: { onInteraction: () => void }) {
  useMapEvents({
    click: onInteraction,
    dragstart: onInteraction,
    zoomstart: onInteraction,
    mousedown: onInteraction,
  });
  return null;
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

function MapView({ onLocationSelect, onCancel }: MapViewProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);
  const [showStationSelector, setShowStationSelector] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [focusedStation, setFocusedStation] = useState<{ id: string; name: string; lat: number; lng: number } | undefined>(undefined);
  const { user, canSaveMoreLocations } = useAuth();

  // Show onboarding overlay on first visit only (not when returning via "Change Location")
  useEffect(() => {
    if (!onCancel && !localStorage.getItem('hasSeenMapOnboarding')) {
      setShowOnboarding(true);
    }
  }, [onCancel]);


  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenMapOnboarding', 'true');
  };

  const handleLocationClick = (location: Location) => {
    if (showOnboarding) {
      dismissOnboarding();
    }
    setPendingLocation(location);
    setFocusedStation(undefined);
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

  const handleStationMarkerClick = (station: { id: string; name: string; lat: number; lng: number }) => {
    if (showOnboarding) {
      dismissOnboarding();
    }
    setPendingLocation({
      latitude: station.lat,
      longitude: station.lng,
      name: station.name
    });
    setFocusedStation(station);
    setShowStationSelector(true);
  };

  const handleStationSelectorClose = () => {
    setShowStationSelector(false);
    setPendingLocation(null);
    setFocusedStation(undefined);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.875rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-text-secondary)';
                e.currentTarget.style.color = 'var(--color-text)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Dashboard
            </button>
          )}
          <h1 style={{ fontSize: '1.5rem' }}>My Marine Forecast</h1>
        </div>
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
          <TideStationMarkers onStationClick={handleStationMarkerClick} />
          {showOnboarding && <MapInteractionListener onInteraction={dismissOnboarding} />}
        </MapContainer>

        {/* First-visit onboarding overlay */}
        {showOnboarding && (
          <MapOnboarding
            onDismiss={dismissOnboarding}
          />
        )}

        {/* Footer links for Privacy & Terms */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: '0.375rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'rgba(13, 17, 23, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 400,
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)'
        }}>
          <Link to="/privacy" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >Terms of Service</Link>
        </div>
      </div>

      {/* Tide Station Selector Modal */}
      {showStationSelector && pendingLocation && (
        <TideStationSelector
          userLat={pendingLocation.latitude}
          userLng={pendingLocation.longitude}
          focusedStation={focusedStation}
          onSelect={handleStationSelect}
          onClose={handleStationSelectorClose}
        />
      )}
    </div>
  );
}

export default MapView;
