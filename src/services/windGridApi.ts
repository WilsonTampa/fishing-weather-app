const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
const NOAA_COOPS_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

interface VelocityHeader {
  parameterCategory: number;
  parameterNumber: number;
  lo1: number;
  la1: number;
  lo2: number;
  la2: number;
  dx: number;
  dy: number;
  nx: number;
  ny: number;
  refTime: string;
}

interface VelocityData {
  header: VelocityHeader;
  data: number[];
}

export interface WindStationPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  speedMph: number;
  gustMph: number;
  directionDeg: number;
  directionCardinal: string;
}

export interface WindGridResult {
  velocity: [VelocityData, VelocityData];
  stations: WindStationPoint[];
}

export type WindGridData = [VelocityData, VelocityData];

// ── Wind station list (loaded from pre-fetched JSON) ──

interface WindStationMeta {
  id: string;
  name: string;
  lat: number;
  lng: number;
  state: string;
}

let WIND_STATIONS_CACHE: WindStationMeta[] | null = null;

async function loadWindStations(): Promise<WindStationMeta[]> {
  if (WIND_STATIONS_CACHE) return WIND_STATIONS_CACHE;

  const response = await fetch('/wind-stations.json');
  if (!response.ok) throw new Error('Failed to load wind stations');
  const data = await response.json();
  WIND_STATIONS_CACHE = data.stations as WindStationMeta[];
  return WIND_STATIONS_CACHE;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find wind stations within a given radius (km) of a center point */
function findNearbyStations(
  allStations: WindStationMeta[],
  centerLat: number,
  centerLon: number,
  radiusKm: number = 300
): WindStationMeta[] {
  return allStations
    .map(s => ({ ...s, distance: calculateDistance(centerLat, centerLon, s.lat, s.lng) }))
    .filter(s => s.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

// ── Fetch real-time wind observations from NOAA CO-OPS ──

const MS_TO_MPH = 2.23694;

interface NOAAWindReading {
  t: string;
  s: string;
  d: string;
  dr: string;
  g: string;
  f: string;
}

async function fetchStationWind(stationId: string): Promise<WindStationPoint | null> {
  try {
    // Get last 1 hour of wind data - most recent reading
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;

    const url =
      `${NOAA_COOPS_BASE}?product=wind&application=FishingBoatingWeather` +
      `&begin_date=${fmt(oneHourAgo)}&end_date=${fmt(now)}` +
      `&station=${stationId}&time_zone=gmt&units=metric&format=json`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.error || !data.data || data.data.length === 0) return null;

    // Use most recent reading
    const reading: NOAAWindReading = data.data[data.data.length - 1];
    const speed = parseFloat(reading.s);
    const gust = parseFloat(reading.g);
    const dir = parseFloat(reading.d);

    if (isNaN(speed) || isNaN(dir)) return null;

    return {
      id: stationId,
      name: '',
      lat: 0,
      lon: 0,
      speedMph: Math.round(speed * MS_TO_MPH),
      gustMph: isNaN(gust) ? 0 : Math.round(gust * MS_TO_MPH),
      directionDeg: dir,
      directionCardinal: reading.dr || '',
    };
  } catch {
    return null;
  }
}

/** Fetch wind observations for nearby NOAA stations */
export async function fetchNearbyStationWinds(
  centerLat: number,
  centerLon: number
): Promise<WindStationPoint[]> {
  const allStations = await loadWindStations();
  const nearby = findNearbyStations(allStations, centerLat, centerLon, 300);

  // Limit to 30 stations max to avoid hammering the API
  const stationsToFetch = nearby.slice(0, 30);

  const results = await Promise.allSettled(
    stationsToFetch.map(async (station) => {
      const wind = await fetchStationWind(station.id);
      if (!wind) return null;
      return {
        ...wind,
        name: station.name,
        lat: station.lat,
        lon: station.lng,
      };
    })
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<WindStationPoint | null> => r.status === 'fulfilled'
    )
    .map(r => r.value)
    .filter((s): s is WindStationPoint => s !== null);
}

// ── Dense forecast grid for markers ──

/**
 * Fetch a dense grid of forecast wind data for map markers.
 * This is separate from the velocity grid — tighter spacing for visible markers.
 */
export async function fetchForecastMarkers(
  centerLat: number,
  centerLon: number,
  forecastHour: number = 0
): Promise<WindStationPoint[]> {
  const gridSize = 6;
  const spanDeg = 0.6; // ~130km total — fits well at zoom 10
  const dx = (spanDeg * 2) / (gridSize - 1);
  const dy = (spanDeg * 2) / (gridSize - 1);

  const lo1 = centerLon - spanDeg;
  const la1 = centerLat + spanDeg;

  const lats: number[] = [];
  const lons: number[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      lats.push(la1 - row * dy);
      lons.push(lo1 + col * dx);
    }
  }

  const latStr = lats.map(l => l.toFixed(4)).join(',');
  const lonStr = lons.map(l => l.toFixed(4)).join(',');

  const url = `${OPEN_METEO_BASE}/forecast?latitude=${latStr}&longitude=${lonStr}&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=UTC&forecast_days=3`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo request failed: ${response.status}`);

  const json = await response.json();
  const results = Array.isArray(json) ? json : [json];

  const now = new Date();
  const targetTime = new Date(now.getTime() + forecastHour * 3600 * 1000);
  let timeIndex = 0;
  if (results[0]?.hourly?.time) {
    const times = results[0].hourly.time as string[];
    let minDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
      const diff = Math.abs(new Date(times[i]).getTime() - targetTime.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        timeIndex = i;
      }
    }
  }

  const cardinals = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const points: WindStationPoint[] = [];

  for (let i = 0; i < results.length; i++) {
    const hourly = results[i]?.hourly;
    if (!hourly) continue;

    const speed = hourly.wind_speed_10m?.[timeIndex] ?? 0;
    const dirDeg = hourly.wind_direction_10m?.[timeIndex] ?? 0;

    points.push({
      id: `forecast-${i}`,
      name: '',
      lat: lats[i],
      lon: lons[i],
      speedMph: Math.round(speed * MS_TO_MPH),
      gustMph: 0,
      directionDeg: dirDeg,
      directionCardinal: cardinals[Math.round(dirDeg / 22.5) % 16],
    });
  }

  return points;
}

// ── Velocity grid (animated particles) ──

/**
 * Fetch a grid of wind data from Open-Meteo and convert to leaflet-velocity format.
 */
export async function fetchWindGrid(
  centerLat: number,
  centerLon: number,
  forecastHour: number = 0
): Promise<WindGridResult> {
  const gridSize = 10;
  const spanDeg = 3;
  const dx = (spanDeg * 2) / (gridSize - 1);
  const dy = (spanDeg * 2) / (gridSize - 1);

  const lo1 = centerLon - spanDeg;
  const la1 = centerLat + spanDeg;
  const lo2 = centerLon + spanDeg;
  const la2 = centerLat - spanDeg;

  const lats: number[] = [];
  const lons: number[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      lats.push(la1 - row * dy);
      lons.push(lo1 + col * dx);
    }
  }

  const latStr = lats.map(l => l.toFixed(4)).join(',');
  const lonStr = lons.map(l => l.toFixed(4)).join(',');

  const url = `${OPEN_METEO_BASE}/forecast?latitude=${latStr}&longitude=${lonStr}&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=UTC&forecast_days=3`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }

  const json = await response.json();
  const results = Array.isArray(json) ? json : [json];

  const now = new Date();
  const refTime = now.toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00Z');

  const targetTime = new Date(now.getTime() + forecastHour * 3600 * 1000);
  let timeIndex = 0;
  if (results[0]?.hourly?.time) {
    const times = results[0].hourly.time as string[];
    let minDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
      const diff = Math.abs(new Date(times[i]).getTime() - targetTime.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        timeIndex = i;
      }
    }
  }

  const uData: number[] = [];
  const vData: number[] = [];

  for (let i = 0; i < results.length; i++) {
    const hourly = results[i]?.hourly;
    if (!hourly) {
      uData.push(0);
      vData.push(0);
      continue;
    }

    const speed = hourly.wind_speed_10m?.[timeIndex] ?? 0;
    const dirDeg = hourly.wind_direction_10m?.[timeIndex] ?? 0;
    const dirRad = (dirDeg * Math.PI) / 180;
    uData.push(-speed * Math.sin(dirRad));
    vData.push(-speed * Math.cos(dirRad));
  }

  const header: VelocityHeader = {
    parameterCategory: 2,
    parameterNumber: 2,
    lo1,
    la1,
    lo2,
    la2,
    dx,
    dy,
    nx: gridSize,
    ny: gridSize,
    refTime,
  };

  return {
    velocity: [
      { header: { ...header, parameterNumber: 2 }, data: uData },
      { header: { ...header, parameterNumber: 3 }, data: vData },
    ],
    stations: [],
  };
}
