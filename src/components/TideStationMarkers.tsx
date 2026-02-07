import { useState, useEffect, useCallback } from 'react';
import { Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { loadAllTideStations } from '../services/noaaApi';

interface TideStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
}

interface TideStationMarkersProps {
  onStationClick: (station: TideStation) => void;
}

const tideStationIcon = L.divIcon({
  className: 'tide-station-marker',
  html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#0e639c" stroke="white" stroke-width="2"/>
    <path d="M6 13c1.5-2 3-2 4.5 0s3 2 4.5 0s3 0 3 0" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M6 10c1.5-2 3-2 4.5 0s3 2 4.5 0s3 0 3 0" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"/>
  </svg>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Only show markers when zoomed in enough to avoid clutter
const MIN_ZOOM_FOR_MARKERS = 7;

export default function TideStationMarkers({ onStationClick }: TideStationMarkersProps) {
  const [allStations, setAllStations] = useState<TideStation[]>([]);
  const [visibleStations, setVisibleStations] = useState<TideStation[]>([]);
  const map = useMap();

  // Load all stations once
  useEffect(() => {
    loadAllTideStations().then(setAllStations);
  }, []);

  const updateVisibleStations = useCallback(() => {
    const zoom = map.getZoom();
    if (zoom < MIN_ZOOM_FOR_MARKERS || allStations.length === 0) {
      setVisibleStations([]);
      return;
    }

    const bounds = map.getBounds();
    const visible = allStations.filter(s =>
      s.lat >= bounds.getSouth() &&
      s.lat <= bounds.getNorth() &&
      s.lng >= bounds.getWest() &&
      s.lng <= bounds.getEast()
    );
    setVisibleStations(visible);
  }, [map, allStations]);

  // Update on map move/zoom and when stations load
  useMapEvents({
    moveend: updateVisibleStations,
    zoomend: updateVisibleStations,
  });

  useEffect(() => {
    updateVisibleStations();
  }, [updateVisibleStations]);

  return (
    <>
      {visibleStations.map(station => (
        <Marker
          key={station.id}
          position={[station.lat, station.lng]}
          icon={tideStationIcon}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              onStationClick(station);
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            <span style={{ fontWeight: 500 }}>{station.name}</span>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
