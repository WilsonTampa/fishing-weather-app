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

// Tide data
export interface TideData {
  timestamp: string;
  height: number; // feet
  type: 'H' | 'L'; // High or Low
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
