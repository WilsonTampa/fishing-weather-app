// ── Model identification ──

export type WeatherModelId = 'gfs' | 'ecmwf' | 'hrrr' | 'nam';
export type WaveModelId = 'ecmwf_wam' | 'gfs_ww3';

// ── Per-model forecast data (after parsing, before normalization) ──

export interface ModelWindData {
  timestamp: string;   // ISO 8601
  speed: number;       // mph
  gusts: number;       // mph
  direction: number;   // degrees 0-360
}

export interface ModelWaveData {
  timestamp: string;
  height: number;      // feet
  direction: number;   // degrees 0-360
  period: number;      // seconds
}

export interface ModelWeatherData {
  timestamp: string;
  precipitationProbability: number; // 0-100
  cloudCover: number;               // 0-100
}

export interface ModelTemperatureData {
  timestamp: string;
  temperature: number; // Fahrenheit
  feelsLike: number;   // Fahrenheit
}

export interface ModelPressureData {
  timestamp: string;
  pressure: number;    // inHg
}

// ── Single model's complete forecast ──

export interface SingleModelForecast {
  modelId: WeatherModelId;
  fetchedAt: string;        // ISO 8601 — when data was fetched
  availableThrough: string; // ISO 8601 — last timestamp with data
  wind: ModelWindData[];
  temperature: ModelTemperatureData[];
  weather: ModelWeatherData[];
  pressure: ModelPressureData[];
}

export interface SingleWaveModelForecast {
  modelId: WaveModelId;
  fetchedAt: string;
  availableThrough: string;
  waves: ModelWaveData[];
}

// ── Normalized (aligned to common hourly time grid) ──

export interface NormalizedModelData {
  wind: { speed: number; gusts: number; direction: number } | null;
  temperature: { temperature: number; feelsLike: number } | null;
  weather: { precipitationProbability: number; cloudCover: number } | null;
  pressure: { pressure: number } | null;
}

export interface NormalizedWaveData {
  height: number;
  direction: number;
  period: number;
}

export interface NormalizedTimestamp {
  timestamp: string; // ISO 8601, hourly aligned
  models: Partial<Record<WeatherModelId, NormalizedModelData>>;
  waveModels: Partial<Record<WaveModelId, NormalizedWaveData | null>>;
}

// ── Confidence scoring ──

export type ConfidenceLevel = 'high' | 'moderate' | 'low';

export type ConfidenceParameter =
  | 'windSpeed'
  | 'windGusts'
  | 'waveHeight'
  | 'precipitation'
  | 'windDirection';

export interface ParameterAgreement {
  parameter: ConfidenceParameter;
  agrees: boolean;
  spread: number;         // actual spread between models
  threshold: number;      // the agreement threshold
  modelsCompared: number; // how many models had data for this param
  weight: number;         // the weight applied (from PRD)
}

export interface ConfidenceScore {
  timestamp: string;
  overall: number;            // 0-100
  level: ConfidenceLevel;
  breakdown: ParameterAgreement[];
  modelsAvailable: WeatherModelId[];
  waveModelsAvailable: WaveModelId[];
}

// ── Top-level multi-model result ──

export interface MultiModelData {
  models: SingleModelForecast[];
  waveModels: SingleWaveModelForecast[];
  normalized: NormalizedTimestamp[];
  confidence: ConfidenceScore[];
  fetchedAt: string;
}
