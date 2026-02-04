// Location types
export interface Location {
  latitude: number;
  longitude: number;
  name?: string;
  tideStationId?: string;
  tideStationDistance?: number; // km or miles
}

// Wind data
export interface WindData {
  timestamp: string; // ISO 8601
  speed: number; // mph or knots
  gusts: number;
  direction: number; // degrees (0-360)
  directionCardinal: string; // N, NE, E, etc.
}

// Temperature data
export interface TemperatureData {
  timestamp: string; // ISO 8601
  temperature: number; // degrees F or C
  feelsLike?: number; // optional feels-like temperature
  high?: number; // daily high
  low?: number; // daily low
}

// Weather conditions data
export interface WeatherData {
  timestamp: string; // ISO 8601
  precipitationProbability: number; // percentage (0-100)
  cloudCover: number; // percentage (0-100)
}

// Tide data
export interface TideData {
  timestamp: string;
  height: number; // feet
  type: 'H' | 'L'; // High or Low
}

// Wave data
export interface WaveData {
  timestamp: string;           // ISO 8601
  height: number;              // combined wave height in feet
  windWaveHeight: number;      // wind-generated wave height in feet
  direction: number;           // wave direction in degrees (0-360)
  directionCardinal: string;   // N, NE, E, etc.
  period: number;              // wave period in seconds
}

// Marine alert data (from NWS API)
export interface MarineAlert {
  event: string;            // e.g. "Small Craft Advisory"
  severity: string;         // Minor, Moderate, Severe, Extreme
  headline: string;         // Full headline text
  description: string;      // Detailed description
  instruction: string;      // Safety instructions
  onset: string;            // ISO 8601 start time
  ends: string;             // ISO 8601 end time
  senderName: string;       // e.g. "NWS Tampa Bay Ruskin FL"
}

// Water temperature data
export interface WaterTemperatureData {
  timestamp: string;
  temperature: number; // degrees F
}

// Current conditions
export interface CurrentConditions {
  temperature: number;
  feelsLike?: number;
  high: number;
  low: number;
  precipitation: number;
  pressure: number;
  humidity: number;
  uvIndex: number;
  uvLevel: string;
  weatherIcon: string;
  description: string;
}

// Forecast for a specific day
export interface DayForecast {
  date: string; // ISO date
  wind: WindData[];
  temperature: TemperatureData[];
  tide: TideData[];
  currentConditions?: CurrentConditions;
}

// User preferences
export interface UserPreferences {
  units: {
    temperature: 'F' | 'C';
    speed: 'mph' | 'knots';
    height: 'ft' | 'm';
  };
  timeFormat: '12h' | '24h';
}
