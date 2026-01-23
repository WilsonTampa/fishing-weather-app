import { WindData, TemperatureData, TideData, WeatherData, Location } from '../types';

// NOAA CO-OPS API base URL for tide data
const NOAA_COOPS_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

// NOAA CO-OPS Metadata API for finding stations
const NOAA_METADATA_BASE = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json';

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
  // Florida Gulf Coast (Tampa Bay Area)
  { id: '8726520', name: 'St. Petersburg, Tampa Bay', lat: 27.7606, lng: -82.6269 },
  { id: '8726607', name: 'Old Port Tampa', lat: 27.8569, lng: -82.5544 },
  { id: '8726384', name: 'Clearwater Beach', lat: 27.9783, lng: -82.8317 },
  { id: '8726724', name: 'McKay Bay Entrance', lat: 27.9100, lng: -82.4317 },
  { id: '8726667', name: 'Port Manatee', lat: 27.6383, lng: -82.5633 },
  { id: '8726679', name: 'Middle Tampa Bay', lat: 27.6500, lng: -82.5817 },
  { id: '8726694', name: 'Egmont Channel', lat: 27.6000, lng: -82.7633 },

  // Florida Gulf Coast (Southwest - Fort Myers/Captiva Area)
  { id: '8725110', name: 'Naples, Gulf of Mexico', lat: 26.1317, lng: -81.8075 },
  { id: '8725520', name: 'Fort Myers', lat: 26.6483, lng: -81.8700 },
  { id: '8725384', name: 'Captiva Island', lat: 26.5317, lng: -82.1867 },
  { id: '8725392', name: 'North Captiva Island', lat: 26.6467, lng: -82.2183 },
  { id: '8725354', name: 'Redfish Pass', lat: 26.5333, lng: -82.2167 },
  { id: '8725405', name: 'Galt Island', lat: 26.7217, lng: -82.1817 },
  { id: '8725412', name: 'Saint James City', lat: 26.5017, lng: -82.0833 },
  { id: '8725435', name: 'Pine Island Center', lat: 26.6067, lng: -82.1100 },
  { id: '8725437', name: 'Pineland', lat: 26.6783, lng: -82.1483 },
  { id: '8725440', name: 'Tarpon Bay', lat: 26.4583, lng: -82.0867 },
  { id: '8725447', name: 'Punta Rassa', lat: 26.4833, lng: -82.0050 },
  { id: '8725480', name: 'Bokeelia', lat: 26.6900, lng: -82.1467 },
  { id: '8725500', name: 'Matlacha', lat: 26.6317, lng: -82.0733 },
  { id: '8726412', name: 'Venice', lat: 27.0683, lng: -82.4483 },

  // Florida Gulf Coast (North)
  { id: '8728690', name: 'Apalachicola', lat: 29.7267, lng: -84.9817 },
  { id: '8729108', name: 'Panama City', lat: 30.1517, lng: -85.6669 },
  { id: '8729210', name: 'Panama City Beach', lat: 30.2133, lng: -85.8783 },
  { id: '8729840', name: 'Pensacola', lat: 30.4050, lng: -87.2117 },
  { id: '8727520', name: 'Cedar Key', lat: 29.1350, lng: -83.0317 },

  // Florida Keys
  { id: '8724580', name: 'Key West', lat: 24.5511, lng: -81.8081 },
  { id: '8723970', name: 'Vaca Key', lat: 24.7117, lng: -81.1050 },
  { id: '8723214', name: 'Virginia Key, Biscayne Bay', lat: 25.7311, lng: -80.1606 },

  // Florida East Coast
  { id: '8721164', name: 'Trident Pier, Port Canaveral', lat: 28.4156, lng: -80.5939 },
  { id: '8720218', name: 'Mayport', lat: 30.3967, lng: -81.4300 },
  { id: '8720030', name: 'Fernandina Beach', lat: 30.6717, lng: -81.4650 },
  { id: '8722670', name: 'Lake Worth Pier', lat: 26.6133, lng: -80.0350 },
  { id: '8722548', name: 'Boynton Beach Inlet', lat: 26.5433, lng: -80.0483 },

  // Southeast Atlantic
  { id: '8670870', name: 'Fort Pulaski, GA', lat: 32.0333, lng: -80.9017 },
  { id: '8665530', name: 'Charleston, Cooper River', lat: 32.7814, lng: -79.9247 },
  { id: '8661070', name: 'Springmaid Pier, SC', lat: 33.6550, lng: -78.9183 },
  { id: '8658120', name: 'Wilmington, NC', lat: 34.2272, lng: -77.9533 },
  { id: '8656483', name: 'Beaufort, NC', lat: 34.7200, lng: -76.6700 },
  { id: '8654467', name: 'Wrightsville Beach, NC', lat: 34.2133, lng: -77.7867 },
  { id: '8651370', name: 'Duck, NC', lat: 36.1833, lng: -75.7467 },

  // Mid-Atlantic
  { id: '8638610', name: 'Sewells Point, Norfolk', lat: 36.9467, lng: -76.3300 },
  { id: '8632200', name: 'Kiptopeke, VA', lat: 37.1667, lng: -75.9883 },
  { id: '8574680', name: 'Lewes, DE', lat: 38.7817, lng: -75.1200 },

  // Northeast
  { id: '8518750', name: 'The Battery, New York', lat: 40.7006, lng: -74.0142 },
  { id: '8516945', name: 'Kings Point, NY', lat: 40.8100, lng: -73.7650 },
  { id: '8454000', name: 'Providence, RI', lat: 41.8067, lng: -71.4006 },
  { id: '8443970', name: 'Boston, MA', lat: 42.3539, lng: -71.0533 },
  { id: '8418150', name: 'Portland, ME', lat: 43.6567, lng: -70.2467 },

  // West Coast
  { id: '9414290', name: 'San Francisco', lat: 37.8067, lng: -122.4650 },
  { id: '9410170', name: 'San Diego', lat: 32.7142, lng: -117.1733 },
  { id: '9447130', name: 'Seattle', lat: 47.6031, lng: -122.3389 },
  { id: '9435380', name: 'Astoria, OR', lat: 46.2072, lng: -123.7686 },
  { id: '9413450', name: 'Monterey, CA', lat: 36.6050, lng: -121.8883 },
  { id: '9411340', name: 'Santa Monica, CA', lat: 34.0083, lng: -118.5000 },
];

/**
 * Fetch nearby tide stations (synchronous, using hardcoded list)
 * Note: NOAA metadata API doesn't support CORS for browser requests
 */
export async function fetchNearbyTideStations(lat: number, lng: number, radiusKm: number = 80.47): Promise<TideStation[]> {
  // Use hardcoded station list (NOAA API doesn't support CORS)
  return Promise.resolve(findNearbyTideStationsFromList(lat, lng, radiusKm));
}

/**
 * Find nearby tide stations from hardcoded list
 */
function findNearbyTideStationsFromList(lat: number, lng: number, maxDistanceKm: number = 80.47): TideStation[] {
  const nearby: TideStation[] = [];

  for (const station of TIDE_STATIONS) {
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
): Promise<{ wind: WindData[], temperature: TemperatureData[], weather: WeatherData[] }> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability,cloud_cover',
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
    const weatherData: WeatherData[] = [];

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
    }

    return { wind: windData, temperature: temperatureData, weather: weatherData };
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
export async function getLocationForecast(location: Location, tideStationId?: string) {
  try {
    // Use provided tide station ID or find nearest
    let tideStation: TideStation | null | undefined;

    if (tideStationId) {
      // Find the specific station by ID
      const station = TIDE_STATIONS.find(s => s.id === tideStationId);
      if (station) {
        const distance = calculateDistance(location.latitude, location.longitude, station.lat, station.lng);
        tideStation = { ...station, distance };
      } else {
        // Fallback to nearest if specified ID not found
        tideStation = findNearestTideStation(location.latitude, location.longitude);
      }
    } else {
      // Find nearest tide station
      tideStation = findNearestTideStation(location.latitude, location.longitude);
    }

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
      weather: weather.weather,
      tides,
      tideStation: tideStation || undefined
    };
  } catch (error) {
    console.error('Error getting location forecast:', error);
    throw error;
  }
}
