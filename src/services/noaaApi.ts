import { WindData, TemperatureData, TideData, Location } from '../types';

// NOAA CO-OPS API base URL for tide data
const NOAA_COOPS_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

// Open-Meteo API (free weather data)
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

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
 * List of major NOAA tide stations along US coasts
 * This is a subset - in production, you'd query the full station list
 */
const TIDE_STATIONS = [
  { id: '8726520', name: 'St. Petersburg, Tampa Bay', lat: 27.7606, lng: -82.6269 },
  { id: '8729108', name: 'Panama City, FL', lat: 30.1517, lng: -85.6669 },
  { id: '8726607', name: 'Old Port Tampa', lat: 27.8569, lng: -82.5544 },
  { id: '8725110', name: 'Naples, Gulf of Mexico', lat: 26.1317, lng: -81.8075 },
  { id: '8724580', name: 'Key West', lat: 24.5511, lng: -81.8081 },
  { id: '8723214', name: 'Virginia Key, Biscayne Bay', lat: 25.7311, lng: -80.1606 },
  { id: '8721164', name: 'Trident Pier, Port Canaveral', lat: 28.4156, lng: -80.5939 },
  { id: '8670870', name: 'Fort Pulaski, GA', lat: 32.0333, lng: -80.9017 },
  { id: '8665530', name: 'Charleston, Cooper River', lat: 32.7814, lng: -79.9247 },
  { id: '8658120', name: 'Wilmington, NC', lat: 34.2272, lng: -77.9533 },
  { id: '8651370', name: 'Duck, NC', lat: 36.1833, lng: -75.7467 },
  { id: '8638610', name: 'Sewells Point, Norfolk', lat: 36.9467, lng: -76.3300 },
  { id: '8518750', name: 'The Battery, New York', lat: 40.7006, lng: -74.0142 },
  { id: '8454000', name: 'Providence, RI', lat: 41.8067, lng: -71.4006 },
  { id: '8443970', name: 'Boston, MA', lat: 42.3539, lng: -71.0533 },
  { id: '8418150', name: 'Portland, ME', lat: 43.6567, lng: -70.2467 },
  { id: '9414290', name: 'San Francisco', lat: 37.8067, lng: -122.4650 },
  { id: '9410170', name: 'San Diego', lat: 32.7142, lng: -117.1733 },
  { id: '9447130', name: 'Seattle', lat: 47.6031, lng: -122.3389 },
  { id: '9435380', name: 'Astoria, OR', lat: 46.2072, lng: -123.7686 },
];

/**
 * Find the nearest tide station to a given location
 */
export function findNearestTideStation(lat: number, lng: number): TideStation | null {
  if (TIDE_STATIONS.length === 0) return null;

  let nearest = TIDE_STATIONS[0];
  let minDistance = calculateDistance(lat, lng, nearest.lat, nearest.lng);

  for (const station of TIDE_STATIONS) {
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
      throw new Error(`NOAA CO-OPS API error: ${response.status}`);
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
): Promise<{ wind: WindData[], temperature: TemperatureData[] }> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'America/New_York',
    forecast_days: '7'
  });

  try {
    const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();

    const windData: WindData[] = [];
    const temperatureData: TemperatureData[] = [];

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
    }

    return { wind: windData, temperature: temperatureData };
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
 * Get complete forecast data for a location
 */
export async function getLocationForecast(location: Location) {
  try {
    // Find nearest tide station
    const tideStation = findNearestTideStation(location.latitude, location.longitude);

    // Fetch weather data
    const weatherPromise = fetchWeatherData(location.latitude, location.longitude);

    // Fetch tide data if station found
    // Set start date to beginning of today to include all tides for today
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);

    const tidePromise = tideStation
      ? fetchTideData(tideStation.id, startDate, endDate)
      : Promise.resolve([]);

    const [weather, tides] = await Promise.all([weatherPromise, tidePromise]);

    return {
      wind: weather.wind,
      temperature: weather.temperature,
      tides,
      tideStation: tideStation || undefined
    };
  } catch (error) {
    console.error('Error getting location forecast:', error);
    throw error;
  }
}
