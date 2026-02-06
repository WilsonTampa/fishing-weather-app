import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Reuse the marker icon configuration
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const thumbnailIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [20, 33],
  iconAnchor: [10, 33]
});

interface LocationThumbnailProps {
  latitude: number;
  longitude: number;
  onClick: () => void;
}

function LocationThumbnail({ latitude, longitude, onClick }: LocationThumbnailProps) {
  return (
    <div
      onClick={onClick}
      style={{
        width: '120px',
        height: '80px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '2px solid var(--color-border)',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={9}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={thumbnailIcon} />
      </MapContainer>

      {/* Click hint overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        fontSize: '0.65rem',
        padding: '2px 4px',
        textAlign: 'center'
      }}>
        Click to change
      </div>
    </div>
  );
}

export default LocationThumbnail;
