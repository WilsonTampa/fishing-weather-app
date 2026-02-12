import { WindData, TemperatureData, TideData, WeatherData, WaveData, MarineAlert, Location } from '../types';
import { fetchMultiModelData } from './multiModelApi';
import type { MultiModelData } from '../types/multiModel';

// NOAA CO-OPS API base URL for tide data
const NOAA_COOPS_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

// Open-Meteo API (free weather data)
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

// Open-Meteo Marine API (free wave/ocean data)
const OPEN_METEO_MARINE_BASE = 'https://marine-api.open-meteo.com/v1';

// NWS API (free, no key required — marine alerts)
const NWS_API_BASE = 'https://api.weather.gov';

interface TideStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Cache for all tide stations loaded from static JSON
 * Loaded once on first use and cached in memory
 */
let TIDE_STATIONS_CACHE: TideStation[] | null = null;

/**
 * Load all tide stations from static JSON file
 * Data is fetched during build time via scripts/fetch-stations.js
 */
export async function loadAllTideStations(): Promise<TideStation[]> {
  // Return cached data if already loaded
  if (TIDE_STATIONS_CACHE !== null) {
    return TIDE_STATIONS_CACHE;
  }

  try {
    const response = await fetch('/tide-stations.json');
    if (!response.ok) {
      throw new Error(`Failed to load tide stations: ${response.status}`);
    }

    const data = await response.json();

    // Map to our TideStation interface (without distance initially)
    const stations = data.stations.map((s: any) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      distance: 0 // Will be calculated when filtering by location
    }));

    // Cache for future use
    TIDE_STATIONS_CACHE = stations;

    console.log(`Loaded ${stations.length} tide stations from static data`);
    return stations;
  } catch (error) {
    console.error('Error loading tide stations:', error);
    // Return empty array as fallback
    return [];
  }
}

/**
 * Fetch nearby tide stations from static JSON file
 * Data is pre-fetched during build from NOAA API (3,379+ stations)
 */
export async function fetchNearbyTideStations(lat: number, lng: number, radiusKm: number = 80.47): Promise<TideStation[]> {
  const allStations = await loadAllTideStations();
  return findNearbyTideStationsFromList(allStations, lat, lng, radiusKm);
}

/**
 * Find nearby tide stations from provided list
 */
function findNearbyTideStationsFromList(stations: TideStation[], lat: number, lng: number, maxDistanceKm: number = 80.47): TideStation[] {
  const nearby: TideStation[] = [];

  for (const station of stations) {
    const distance = calculateDistance(lat, lng, station.lat, station.lng);
    if (distance <= maxDistanceKm) {
      nearby.push({
        ...station,
        distance
      });
    }
  }

  // Sort by distance, nearest first
  return nearby.sort((a, b) => a.distance - b.distance);
}

/**
 * Find the nearest tide station to a given location
 */
export async function findNearestTideStation(lat: number, lng: number): Promise<TideStation | null> {
  const allStations = await loadAllTideStations();

  if (allStations.length === 0) return null;

  let nearest = allStations[0];
  let minDistance = calculateDistance(lat, lng, nearest.lat, nearest.lng);

  for (const station of allStations) {
    const distance = calculateDistance(lat, lng, station.lat, station.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = station;
    }
  }

  return {
    ...nearest,
    distance: minDistance
  };
}


/**
 * Fetch current water temperature from NOAA CO-OPS API
 */
export async function fetchWaterTemperature(
  stationId: string
): Promise<number | null> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const beginDate = oneHourAgo.toISOString().split('T')[0].replace(/-/g, '');
  const endDateStr = now.toISOString().split('T')[0].replace(/-/g, '');

  const params = new URLSearchParams({
    product: 'water_temperature',
    application: 'FishingBoatingApp',
    begin_date: beginDate,
    end_date: endDateStr,
    station: stationId,
    time_zone: 'lst_ldt',
    units: 'english',
    format: 'json'
  });

  try {
    const response = await fetch(`${NOAA_COOPS_BASE}?${params}`);
    if (!response.ok) {
      // Station may not have water temperature sensor
      console.log(`Water temperature not available for station: ${stationId}`);
      return null;
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return null;
    }

    // Get the most recent temperature reading
    const latestReading = data.data[data.data.length - 1];
    return parseFloat(latestReading.v);
  } catch (error) {
    console.log('Water temperature not available:', error);
    return null;
  }
}

/**
 * Fetch tide predictions from NOAA CO-OPS API
 */
export async function fetchTideData(
  stationId: string,
  startDate: Date,
  endDate: Date
): Promise<TideData[]> {
  const beginDate = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');

  const params = new URLSearchParams({
    product: 'predictions',
    application: 'FishingBoatingApp',
    begin_date: beginDate,
    end_date: endDateStr,
    datum: 'MLLW',
    station: stationId,
    time_zone: 'lst_ldt',
    units: 'english',
    interval: 'hilo',
    format: 'json'
  });

  try {
    const response = await fetch(`${NOAA_COOPS_BASE}?${params}`);
    if (!response.ok) {
      // Log the invalid station ID for debugging
      console.warn(`Invalid or unavailable tide station: ${stationId}`);
      throw new Error(`NOAA CO-OPS API error: ${response.status} for station ${stationId}`);
    }

    const data = await response.json();

    if (!data.predictions || data.predictions.length === 0) {
      return [];
    }

    return data.predictions.map((pred: any) => ({
      timestamp: pred.t,
      height: parseFloat(pred.v),
      type: pred.type as 'H' | 'L'
    }));
  } catch (error) {
    console.error('Error fetching tide data:', error);
    throw error;
  }
}

/**
 * Fetch weather data from Open-Meteo API (free, no key required)
 */
export async function fetchWeatherData(
  lat: number,
  lng: number
): Promise<{ wind: WindData[], temperature: TemperatureData[], weather: WeatherData[], pressure: { timestamp: string; pressure: number }[] }> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability,cloud_cover,surface_pressure',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'America/New_York',
    forecast_days: '10'
  });

  try {
    const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();

    const windData: WindData[] = [];
    const temperatureData: TemperatureData[] = [];
    const weatherData: WeatherData[] = [];
    const pressureData: { timestamp: string; pressure: number }[] = [];

    for (let i = 0; i < data.hourly.time.length; i++) {
      const timestamp = data.hourly.time[i];

      windData.push({
        timestamp,
        speed: data.hourly.wind_speed_10m[i] || 0,
        gusts: data.hourly.wind_gusts_10m[i] || 0,
        direction: data.hourly.wind_direction_10m[i] || 0,
        directionCardinal: degreesToCardinal(data.hourly.wind_direction_10m[i] || 0)
      });

      temperatureData.push({
        timestamp,
        temperature: data.hourly.temperature_2m[i] || 0,
        feelsLike: data.hourly.apparent_temperature[i] || 0
      });

      weatherData.push({
        timestamp,
        precipitationProbability: data.hourly.precipitation_probability[i] || 0,
        cloudCover: data.hourly.cloud_cover[i] || 0
      });

      // Convert hPa to inHg (1 hPa = 0.02953 inHg)
      const pressureInHg = (data.hourly.surface_pressure[i] || 1013.25) * 0.02953;
      pressureData.push({
        timestamp,
        pressure: pressureInHg
      });
    }

    return { wind: windData, temperature: temperatureData, weather: weatherData, pressure: pressureData };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

/**
 * Convert wind direction degrees to cardinal direction
 */
function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Fetch wave data from Open-Meteo Marine API (free, no key required)
 */
export async function fetchWaveData(
  lat: number,
  lng: number
): Promise<WaveData[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'wave_height,wave_direction,wave_period,wind_wave_height',
    length_unit: 'imperial',
    timezone: 'America/New_York',
    forecast_days: '10'
  });

  try {
    const response = await fetch(`${OPEN_METEO_MARINE_BASE}/marine?${params}`);
    if (!response.ok) {
      throw new Error(`Open-Meteo Marine API error: ${response.status}`);
    }

    const data = await response.json();
    const waveData: WaveData[] = [];

    if (!data.hourly || !data.hourly.time) {
      return [];
    }

    for (let i = 0; i < data.hourly.time.length; i++) {
      waveData.push({
        timestamp: data.hourly.time[i],
        height: data.hourly.wave_height[i] ?? 0,
        windWaveHeight: data.hourly.wind_wave_height[i] ?? 0,
        direction: data.hourly.wave_direction[i] ?? 0,
        directionCardinal: degreesToCardinal(data.hourly.wave_direction[i] ?? 0),
        period: data.hourly.wave_period[i] ?? 0
      });
    }

    return waveData;
  } catch (error) {
    console.error('Error fetching wave data:', error);
    return [];
  }
}

/**
 * Fetch marine alerts from NWS API using tide station coordinates
 * Uses the tide station lat/lng since those are on/near water and fall within marine forecast zones
 */
export async function fetchMarineAlerts(
  lat: number,
  lng: number
): Promise<MarineAlert[]> {
  try {
    const response = await fetch(
      `${NWS_API_BASE}/alerts/active?point=${lat},${lng}`,
      {
        headers: {
          'Accept': 'application/geo+json',
          'User-Agent': 'FishingBoatingApp'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`NWS API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return [];
    }

    // Filter for Small Craft Advisory only
    const smallCraftAlerts = data.features
      .filter((f: any) => f.properties?.event === 'Small Craft Advisory')
      .map((f: any) => {
        const p = f.properties;
        return {
          event: p.event,
          severity: p.severity || 'Minor',
          headline: p.headline || '',
          description: p.description || '',
          instruction: p.instruction || '',
          onset: p.onset || p.effective || '',
          ends: p.ends || p.expires || '',
          senderName: p.senderName || ''
        } as MarineAlert;
      });

    return smallCraftAlerts;
  } catch (error) {
    console.error('Error fetching marine alerts:', error);
    return [];
  }
}

/**
 * Get complete forecast data for a location
 */
export async function getLocationForecast(
  location: Location,
  tideStationId?: string,
  options?: { includeMultiModel?: boolean }
) {
  try {
    // Use provided tide station ID or find nearest
    let tideStation: TideStation | null | undefined;

    if (tideStationId) {
      // Find the specific station by ID
      const allStations = await loadAllTideStations();
      const station = allStations.find(s => s.id === tideStationId);
      if (station) {
        const distance = calculateDistance(location.latitude, location.longitude, station.lat, station.lng);
        tideStation = { ...station, distance };
      } else {
        // Fallback to nearest if specified ID not found
        console.warn(`Station ${tideStationId} not found in station list, using nearest station`);
        tideStation = await findNearestTideStation(location.latitude, location.longitude);
      }
    } else {
      // Find nearest tide station
      tideStation = await findNearestTideStation(location.latitude, location.longitude);
    }

    // Fetch weather data, wave data, and marine alerts in parallel
    const weatherPromise = fetchWeatherData(location.latitude, location.longitude);
    const wavePromise = fetchWaveData(location.latitude, location.longitude);
    // Use tide station coords for alerts since they're on/near water (within marine forecast zones)
    const alertsPromise = tideStation
      ? fetchMarineAlerts(tideStation.lat, tideStation.lng)
      : Promise.resolve([]) as Promise<MarineAlert[]>;

    // Fetch tide data if station found
    // Set start date to beginning of today to include all tides for today
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 10);
    endDate.setHours(23, 59, 59, 999);

    // Fetch tide data with fallback handling for invalid stations
    let tidePromise: Promise<TideData[]>;
    let waterTempPromise: Promise<number | null>;

    if (tideStation) {
      const currentStationId = tideStation.id;
      tidePromise = fetchTideData(currentStationId, startDate, endDate).catch(async () => {
        // If tide fetch fails (invalid station), try to find nearest valid station
        console.warn(`Failed to fetch tides for station ${currentStationId}, finding nearest valid station`);
        const nearestStation = await findNearestTideStation(location.latitude, location.longitude);
        if (nearestStation && nearestStation.id !== currentStationId) {
          console.log(`Retrying with nearest station: ${nearestStation.id}`);
          tideStation = nearestStation;
          return fetchTideData(nearestStation.id, startDate, endDate);
        }
        return [];
      });

      // Fetch water temperature for the station
      waterTempPromise = fetchWaterTemperature(currentStationId);
    } else {
      tidePromise = Promise.resolve([]);
      waterTempPromise = Promise.resolve(null);
    }

    // Conditionally fetch multi-model data in parallel with everything else
    const multiModelPromise: Promise<MultiModelData | null> =
      options?.includeMultiModel
        ? fetchMultiModelData(location.latitude, location.longitude).catch(err => {
            console.error('Multi-model fetch failed, continuing without:', err);
            return null;
          })
        : Promise.resolve(null);

    const [weather, tides, waterTemp, waves, alerts, multiModel] = await Promise.all([weatherPromise, tidePromise, waterTempPromise, wavePromise, alertsPromise, multiModelPromise]);

    return {
      wind: weather.wind,
      temperature: weather.temperature,
      weather: weather.weather,
      pressure: weather.pressure,
      tides,
      tideStation: tideStation || undefined,
      waterTemperature: waterTemp,
      waves,
      alerts,
      multiModel,
    };
  } catch (error) {
    console.error('Error getting location forecast:', error);
    throw error;
  }
}
