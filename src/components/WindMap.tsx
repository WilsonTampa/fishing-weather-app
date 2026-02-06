import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Tooltip } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-velocity';
import {
  fetchWindGrid,
  fetchNearbyStationWinds,
  WindGridResult,
  WindStationPoint,
} from '../services/windGridApi';
import { Location } from '../types';
import './WindMap.css';

// Extend Leaflet types for leaflet-velocity
declare module 'leaflet' {
  function velocityLayer(options: Record<string, unknown>): L.Layer;
}

/** Get a color based on wind speed in mph */
function getWindColor(mph: number): string {
  if (mph < 5) return '#3288bd';
  if (mph < 10) return '#66c2a5';
  if (mph < 15) return '#e6c520';
  if (mph < 20) return '#fdae61';
  if (mph < 25) return '#f46d43';
  return '#d53e4f';
}

/**
 * Create a Windfinder-style circular station marker:
 * White circle with a directional arrow inside and speed below
 */
function createStationIcon(station: WindStationPoint): L.DivIcon {
  const arrowRotation = (station.directionDeg + 180) % 360; // arrow points where wind is going TO
  const color = getWindColor(station.speedMph);

  const html = `
    <div class="wind-station-marker">
      <div class="wind-station-circle">
        <svg width="28" height="28" viewBox="0 0 28 28">
          <g transform="rotate(${arrowRotation}, 14, 14)">
            <line x1="14" y1="5" x2="14" y2="23" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
            <polygon points="14,3 10,10 18,10" fill="${color}"/>
          </g>
        </svg>
      </div>
      <div class="wind-station-speed" style="color:${color}">${station.speedMph}</div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'wind-station-icon',
    iconSize: [36, 48],
    iconAnchor: [18, 24],
  });
}

// ── Velocity particle layer ──

interface VelocityLayerProps {
  data: WindGridResult | null;
}

function VelocityLayer({ data }: VelocityLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!map || !data) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    try {
      const velocityLayer = L.velocityLayer({
        displayValues: true,
        displayOptions: {
          velocityType: 'Wind',
          position: 'bottomleft',
          emptyString: 'No wind data',
          speedUnit: 'mph',
          directionString: 'Direction',
          speedString: 'Speed',
        },
        data: data.velocity,
        minVelocity: 0,
        maxVelocity: 15,
        velocityScale: 0.008,
        particleAge: 90,
        lineWidth: 2,
        particleMultiplier: 1 / 400,
        frameRate: 15,
        colorScale: [
          '#3288bd',
          '#66c2a5',
          '#abdda4',
          '#e6f598',
          '#fee08b',
          '#fdae61',
          '#f46d43',
          '#d53e4f',
        ],
      });

      velocityLayer.addTo(map);
      layerRef.current = velocityLayer;
    } catch (err) {
      console.error('Failed to create velocity layer:', err);
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, data]);

  return null;
}

// ── Station markers ──

function WindStationMarkers({ stations }: { stations: WindStationPoint[] }) {
  return (
    <>
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.lat, station.lon]}
          icon={createStationIcon(station)}
          zIndexOffset={station.name ? 1100 : 1000}
        >
          <Tooltip direction="top" offset={[0, -26]}>
            <div className="wind-station-tooltip">
              {station.name ? (
                <>
                  <strong>{station.name}</strong>
                  <br />
                </>
              ) : null}
              {station.speedMph} mph{' '}
              {station.gustMph > 0 && (
                <span>(gusts {station.gustMph} mph)</span>
              )}
              <br />
              From {station.directionCardinal || `${Math.round(station.directionDeg)}°`}
            </div>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}


// ── Main WindMap page ──

interface WindMapProps {
  location?: Location | null;
  onLocationChange?: () => void;
}

function WindMap({ location, onLocationChange }: WindMapProps) {
  const navigate = useNavigate();
  const defaultCenter: [number, number] = [27.7676, -82.6403];
  const center: [number, number] = location
    ? [location.latitude, location.longitude]
    : defaultCenter;

  const [windData, setWindData] = useState<WindGridResult | null>(null);
  const [stationData, setStationData] = useState<WindStationPoint[]>([]);
  const [forecastHour, setForecastHour] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real station observations once (these are real-time, not forecast-dependent)
  useEffect(() => {
    setStationsLoading(true);
    fetchNearbyStationWinds(center[0], center[1])
      .then(setStationData)
      .catch((err) => console.error('Failed to fetch station winds:', err))
      .finally(() => setStationsLoading(false));
  }, [center[0], center[1]]);

  // Load velocity grid + forecast markers when forecast hour changes
  const loadWindData = useCallback(
    async (hour: number) => {
      setLoading(true);
      setError(null);
      try {
        const gridData = await fetchWindGrid(center[0], center[1], hour);
        setWindData(gridData);
      } catch (err) {
        console.error('Failed to fetch wind data:', err);
        setError('Failed to load wind data');
      } finally {
        setLoading(false);
      }
    },
    [center[0], center[1]]
  );

  useEffect(() => {
    loadWindData(forecastHour);
  }, [forecastHour, loadWindData]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForecastHour(parseInt(e.target.value, 10));
  };

  const getForecastTimeLabel = () => {
    const now = new Date();
    const target = new Date(now.getTime() + forecastHour * 3600 * 1000);
    return target.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="wind-map-container">
      <div className="wind-map-header">
        <Link to="/forecast" className="wind-map-back">
          &larr; Back
        </Link>
        <h2>Wind Map</h2>
        <span className="wind-map-badge">POC</span>
        <div className="wind-map-header-right">
          {stationsLoading && (
            <span className="wind-map-station-count">Loading stations...</span>
          )}
          {!stationsLoading && (
            <span className="wind-map-station-count">
              {stationData.length} stations
            </span>
          )}
          <button
            className="wind-map-location-btn"
            onClick={() => {
              if (onLocationChange) onLocationChange();
              navigate('/');
            }}
            title="Change location"
          >
            📍 Change Location
          </button>
        </div>
      </div>

      <div className="wind-map-map">
        <MapContainer
          center={center}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <VelocityLayer data={windData} />
          <WindStationMarkers stations={stationData} />
        </MapContainer>

        {loading && (
          <div className="wind-map-loading">
            <div className="spinner" />
            <span>Loading wind data...</span>
          </div>
        )}

        {error && <div className="wind-map-error">{error}</div>}
      </div>

      <div className="wind-map-controls">
        <div className="wind-map-time-label">{getForecastTimeLabel()}</div>
        <div className="wind-map-slider-row">
          <span className="wind-map-slider-label">Now</span>
          <input
            type="range"
            min={0}
            max={48}
            step={1}
            value={forecastHour}
            onChange={handleSliderChange}
            className="wind-map-slider"
          />
          <span className="wind-map-slider-label">+48h</span>
        </div>
      </div>
    </div>
  );
}

export default WindMap;
