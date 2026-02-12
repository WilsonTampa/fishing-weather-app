import type {
  WeatherModelId,
  WaveModelId,
  SingleModelForecast,
  SingleWaveModelForecast,
  ModelWindData,
  ModelTemperatureData,
  ModelWeatherData,
  ModelPressureData,
  ModelWaveData,
  NormalizedTimestamp,
  NormalizedModelData,
  ConfidenceScore,
  ConfidenceLevel,
  ConfidenceParameter,
  ParameterAgreement,
  MultiModelData,
} from '../types/multiModel';

// ── API Constants ──

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
const OPEN_METEO_MARINE_BASE = 'https://marine-api.open-meteo.com/v1';

// Open-Meteo model parameter values (verified against live API)
const WEATHER_MODEL_PARAMS: Record<WeatherModelId, string> = {
  gfs: 'ncep_gfs025',
  ecmwf: 'ecmwf_ifs025',
  hrrr: 'ncep_hrrr_conus',
  nam: 'ncep_nam_conus',
};

const WAVE_MODEL_PARAMS: Record<WaveModelId, string> = {
  ecmwf_wam: 'ecmwf_wam025',
  // Use 0.16° (finer) grid — the 0.25° version treats many coastal locations as
  // land cells and returns all-zero wave heights. The 0.16° grid covers 52.5°N
  // to 15°S which includes all US coastal waters.
  gfs_ww3: 'ncep_gfswave016',
};

// HRRR and NAM cover continental US only
const CONUS_BOUNDS = {
  minLat: 21.0,
  maxLat: 53.0,
  minLng: -134.0,
  maxLng: -60.0,
};

// Hourly params for HRRR (supports precipitation_probability and 10m wind)
const HOURLY_PARAMS_HRRR =
  'temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability,cloud_cover,surface_pressure';

// GFS doesn't provide wind_speed_10m or wind_direction_10m — only 80m+.
// Request both 10m and 80m; parser falls back to 80m when 10m is null.
const HOURLY_PARAMS_GFS =
  'temperature_2m,apparent_temperature,wind_speed_10m,wind_speed_80m,wind_direction_10m,wind_direction_80m,wind_gusts_10m,precipitation_probability,cloud_cover,surface_pressure';

// ECMWF doesn't support precipitation_probability; uses precipitation (mm) instead
const HOURLY_PARAMS_ECMWF =
  'temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,cloud_cover,surface_pressure';

// NAM doesn't support precipitation_probability; uses precipitation (mm) like ECMWF
const HOURLY_PARAMS_NAM =
  'temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,cloud_cover,surface_pressure';

// Confidence scoring weights and thresholds
// Base thresholds assume 2 models. When more models are compared, the max-min
// spread naturally widens (more data points → higher chance of outliers), so
// thresholds are scaled up using MODEL_COUNT_SCALING.
const AGREEMENT_CONFIG: Record<ConfidenceParameter, { weight: number; threshold: number }> = {
  windSpeed:     { weight: 0.35, threshold: 7 },   // mph spread (base for 2 models)
  windGusts:     { weight: 0.20, threshold: 10 },  // mph spread
  waveHeight:    { weight: 0.25, threshold: 2 },   // feet spread
  precipitation: { weight: 0.15, threshold: 0 },   // special: boolean
  windDirection: { weight: 0.05, threshold: 30 },   // degrees spread
};

// Scale thresholds when more models are compared. With 3 models the max-min
// spread is ~20% wider on average; with 4 models ~40% wider.
// Formula: threshold * MODEL_COUNT_SCALING[modelCount] (default 1.0 for 2)
const MODEL_COUNT_SCALING: Record<number, number> = {
  2: 1.0,
  3: 1.2,
  4: 1.4,
};

// Precipitation probability threshold for rain/no-rain binary classification
const RAIN_THRESHOLD = 30; // percent

// ── Helpers ──

export function isInCONUSCoverage(lat: number, lng: number): boolean {
  return (
    lat >= CONUS_BOUNDS.minLat &&
    lat <= CONUS_BOUNDS.maxLat &&
    lng >= CONUS_BOUNDS.minLng &&
    lng <= CONUS_BOUNDS.maxLng
  );
}

/** @deprecated Use isInCONUSCoverage instead */
export const isInHRRRCoverage = isInCONUSCoverage;

function roundToHour(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

// ── Parsers ──

function parseWeatherModelResponse(
  data: any,
  modelId: WeatherModelId
): SingleModelForecast {
  const fetchedAt = new Date().toISOString();
  const hourly = data.hourly;
  const times: string[] = hourly.time;

  const wind: ModelWindData[] = [];
  const temperature: ModelTemperatureData[] = [];
  const weather: ModelWeatherData[] = [];
  const pressure: ModelPressureData[] = [];

  for (let i = 0; i < times.length; i++) {
    const timestamp = times[i];

    // GFS doesn't provide 10m wind — fall back to 80m data scaled down to
    // approximate 10m equivalent. Wind at 80m is typically ~15% higher than
    // at 10m due to the wind profile power law (exponent ~0.143 over water).
    const speed10 = hourly.wind_speed_10m?.[i];
    const speed80 = hourly.wind_speed_80m?.[i];
    const WIND_80M_TO_10M = 0.85; // reduction factor: 10m ≈ 85% of 80m

    // Skip timestamps where all key values are null — this happens when a
    // short-range model (e.g. HRRR ~48h) returns timestamps beyond its
    // actual forecast horizon with null values.
    const rawTemp = hourly.temperature_2m?.[i];
    const rawWindSpeed = speed10 ?? speed80;
    const rawPressure = hourly.surface_pressure?.[i];
    if (rawTemp == null && rawWindSpeed == null && rawPressure == null) {
      continue;
    }

    wind.push({
      timestamp,
      speed: speed10 ?? (speed80 != null ? speed80 * WIND_80M_TO_10M : 0),
      gusts: hourly.wind_gusts_10m?.[i] ?? 0,
      direction: hourly.wind_direction_10m?.[i] ?? hourly.wind_direction_80m?.[i] ?? 0,
    });

    temperature.push({
      timestamp,
      temperature: rawTemp ?? 0,
      feelsLike: hourly.apparent_temperature?.[i] ?? 0,
    });

    // ECMWF uses precipitation (mm) instead of precipitation_probability (%)
    let precipProb: number;
    if (hourly.precipitation_probability) {
      precipProb = hourly.precipitation_probability[i] ?? 0;
    } else if (hourly.precipitation) {
      // Convert mm of precipitation to a rough probability: >0.1mm = likely rain
      precipProb = (hourly.precipitation[i] ?? 0) > 0.1 ? 80 : 0;
    } else {
      precipProb = 0;
    }

    weather.push({
      timestamp,
      precipitationProbability: precipProb,
      cloudCover: hourly.cloud_cover?.[i] ?? 0,
    });

    // Convert hPa to inHg (1 hPa = 0.02953 inHg)
    const pressureInHg = (rawPressure ?? 1013.25) * 0.02953;
    pressure.push({
      timestamp,
      pressure: pressureInHg,
    });
  }

  const availableThrough = times.length > 0 ? times[times.length - 1] : fetchedAt;

  return { modelId, fetchedAt, availableThrough, wind, temperature, weather, pressure };
}

function parseWaveModelResponse(
  data: any,
  modelId: WaveModelId
): SingleWaveModelForecast {
  const fetchedAt = new Date().toISOString();
  const hourly = data.hourly;
  const times: string[] = hourly?.time ?? [];

  const waves: ModelWaveData[] = [];

  for (let i = 0; i < times.length; i++) {
    // Skip timestamps where wave data is null — model has no data for this hour
    const rawHeight = hourly.wave_height?.[i];
    if (rawHeight == null) continue;

    waves.push({
      timestamp: times[i],
      height: rawHeight,
      direction: hourly.wave_direction?.[i] ?? 0,
      period: hourly.wave_period?.[i] ?? 0,
    });
  }

  const availableThrough = times.length > 0 ? times[times.length - 1] : fetchedAt;

  return { modelId, fetchedAt, availableThrough, waves };
}

// ── Fetch Functions ──

async function fetchGFSForecast(lat: number, lng: number): Promise<SingleModelForecast> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: HOURLY_PARAMS_GFS,
    models: WEATHER_MODEL_PARAMS.gfs,
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'America/New_York',
    forecast_days: '10',
  });

  const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);
  if (!response.ok) throw new Error(`GFS fetch failed: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`GFS API error: ${data.reason}`);

  return parseWeatherModelResponse(data, 'gfs');
}

async function fetchECMWFForecast(lat: number, lng: number): Promise<SingleModelForecast> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: HOURLY_PARAMS_ECMWF,
    models: WEATHER_MODEL_PARAMS.ecmwf,
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'America/New_York',
    forecast_days: '10',
  });

  const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);
  if (!response.ok) throw new Error(`ECMWF fetch failed: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`ECMWF API error: ${data.reason}`);

  return parseWeatherModelResponse(data, 'ecmwf');
}

async function fetchHRRRForecast(lat: number, lng: number): Promise<SingleModelForecast> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: HOURLY_PARAMS_HRRR,
    models: WEATHER_MODEL_PARAMS.hrrr,
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'America/New_York',
  });

  const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);
  if (!response.ok) throw new Error(`HRRR fetch failed: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`HRRR API error: ${data.reason}`);

  return parseWeatherModelResponse(data, 'hrrr');
}

async function fetchNAMForecast(lat: number, lng: number): Promise<SingleModelForecast> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: HOURLY_PARAMS_NAM,
    models: WEATHER_MODEL_PARAMS.nam,
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'America/New_York',
  });

  const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);
  if (!response.ok) throw new Error(`NAM fetch failed: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`NAM API error: ${data.reason}`);

  return parseWeatherModelResponse(data, 'nam');
}

async function fetchWaveModelForecast(
  lat: number,
  lng: number,
  modelId: WaveModelId
): Promise<SingleWaveModelForecast> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'wave_height,wave_direction,wave_period',
    models: WAVE_MODEL_PARAMS[modelId],
    length_unit: 'imperial',
    timezone: 'America/New_York',
    forecast_days: '10',
  });

  const response = await fetch(`${OPEN_METEO_MARINE_BASE}/marine?${params}`);
  if (!response.ok) throw new Error(`Wave model ${modelId} fetch failed: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`Wave model ${modelId} API error: ${data.reason}`);

  return parseWaveModelResponse(data, modelId);
}

// ── Normalization ──

type TimestampIndex<T> = Map<string, T>;

function buildWeatherIndex<T extends { timestamp: string }>(
  models: SingleModelForecast[],
  accessor: (model: SingleModelForecast) => T[]
): Map<WeatherModelId, TimestampIndex<T>> {
  const index = new Map<WeatherModelId, TimestampIndex<T>>();
  for (const model of models) {
    const modelIndex = new Map<string, T>();
    for (const item of accessor(model)) {
      modelIndex.set(roundToHour(item.timestamp), item);
    }
    index.set(model.modelId, modelIndex);
  }
  return index;
}

function buildWaveIndex(
  waveModels: SingleWaveModelForecast[]
): Map<WaveModelId, TimestampIndex<ModelWaveData>> {
  const index = new Map<WaveModelId, TimestampIndex<ModelWaveData>>();
  for (const model of waveModels) {
    const modelIndex = new Map<string, ModelWaveData>();
    for (const wave of model.waves) {
      modelIndex.set(roundToHour(wave.timestamp), wave);
    }
    index.set(model.modelId, modelIndex);
  }
  return index;
}

export function normalizeToCommonGrid(
  models: SingleModelForecast[],
  waveModels: SingleWaveModelForecast[]
): NormalizedTimestamp[] {
  if (models.length === 0 && waveModels.length === 0) return [];

  // Collect all unique hourly timestamps
  const allTimestamps = new Set<string>();
  for (const model of models) {
    for (const w of model.wind) {
      allTimestamps.add(roundToHour(w.timestamp));
    }
  }
  for (const wm of waveModels) {
    for (const w of wm.waves) {
      allTimestamps.add(roundToHour(w.timestamp));
    }
  }

  const sortedTimestamps = Array.from(allTimestamps).sort();

  // Build index maps for O(1) lookup
  const windIndex = buildWeatherIndex(models, m => m.wind);
  const tempIndex = buildWeatherIndex(models, m => m.temperature);
  const weatherIndex = buildWeatherIndex(models, m => m.weather);
  const pressureIndex = buildWeatherIndex(models, m => m.pressure);
  const waveIndex = buildWaveIndex(waveModels);

  return sortedTimestamps.map(timestamp => {
    const entry: NormalizedTimestamp = {
      timestamp,
      models: {},
      waveModels: {},
    };

    for (const model of models) {
      const wind = windIndex.get(model.modelId)?.get(timestamp);
      const temp = tempIndex.get(model.modelId)?.get(timestamp);
      const weather = weatherIndex.get(model.modelId)?.get(timestamp);
      const pressure = pressureIndex.get(model.modelId)?.get(timestamp);

      if (wind || temp || weather || pressure) {
        const modelData: NormalizedModelData = {
          wind: wind ? { speed: wind.speed, gusts: wind.gusts, direction: wind.direction } : null,
          temperature: temp ? { temperature: temp.temperature, feelsLike: temp.feelsLike } : null,
          weather: weather ? { precipitationProbability: weather.precipitationProbability, cloudCover: weather.cloudCover } : null,
          pressure: pressure ? { pressure: pressure.pressure } : null,
        };
        entry.models[model.modelId] = modelData;
      }
    }

    for (const wm of waveModels) {
      const wave = waveIndex.get(wm.modelId)?.get(timestamp);
      entry.waveModels[wm.modelId] = wave
        ? { height: wave.height, direction: wave.direction, period: wave.period }
        : null;
    }

    return entry;
  });
}

// ── Confidence Calculation ──

function computeSpreadAgreement(
  parameter: ConfidenceParameter,
  values: number[]
): ParameterAgreement {
  const config = AGREEMENT_CONFIG[parameter];
  if (values.length < 2) {
    return {
      parameter,
      agrees: true,
      spread: 0,
      threshold: config.threshold,
      modelsCompared: values.length,
      weight: config.weight,
    };
  }

  // Scale the threshold based on number of models — more models naturally
  // produce wider max-min spreads even when they broadly agree
  const scaling = MODEL_COUNT_SCALING[values.length] ?? 1 + (values.length - 2) * 0.2;
  const adjustedThreshold = Math.round(config.threshold * scaling * 10) / 10;

  const spread = Math.max(...values) - Math.min(...values);
  return {
    parameter,
    agrees: spread <= adjustedThreshold,
    spread,
    threshold: adjustedThreshold,
    modelsCompared: values.length,
    weight: config.weight,
  };
}

export function computePrecipAgreement(values: number[]): ParameterAgreement {
  const config = AGREEMENT_CONFIG.precipitation;
  if (values.length < 2) {
    return {
      parameter: 'precipitation',
      agrees: true,
      spread: 0,
      threshold: 0,
      modelsCompared: values.length,
      weight: config.weight,
    };
  }

  // All models must agree on rain (>=30%) or no rain (<30%)
  const allRain = values.every(v => v >= RAIN_THRESHOLD);
  const allNoRain = values.every(v => v < RAIN_THRESHOLD);
  const spread = Math.max(...values) - Math.min(...values);

  return {
    parameter: 'precipitation',
    agrees: allRain || allNoRain,
    spread,
    threshold: 0,
    modelsCompared: values.length,
    weight: config.weight,
  };
}

export function computeDirectionAgreement(values: number[]): ParameterAgreement {
  const config = AGREEMENT_CONFIG.windDirection;
  if (values.length < 2) {
    return {
      parameter: 'windDirection',
      agrees: true,
      spread: 0,
      threshold: config.threshold,
      modelsCompared: values.length,
      weight: config.weight,
    };
  }

  // Scale threshold based on number of models
  const scaling = MODEL_COUNT_SCALING[values.length] ?? 1 + (values.length - 2) * 0.2;
  const adjustedThreshold = Math.round(config.threshold * scaling);

  // Circular spread: find the smallest arc containing all values
  const sorted = [...values].sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    maxGap = Math.max(maxGap, sorted[i] - sorted[i - 1]);
  }
  // Wrap-around gap (from last value back to first, going through 360/0)
  maxGap = Math.max(maxGap, 360 - sorted[sorted.length - 1] + sorted[0]);
  const spread = 360 - maxGap;

  return {
    parameter: 'windDirection',
    agrees: spread <= adjustedThreshold,
    spread,
    threshold: adjustedThreshold,
    modelsCompared: values.length,
    weight: config.weight,
  };
}

export function computeConfidenceScores(
  normalized: NormalizedTimestamp[]
): ConfidenceScore[] {
  return normalized.map(entry => {
    // Only count models that actually have meaningful data at this timestamp.
    // A model entry with all-null sub-fields means it was present in the grid
    // but has no real forecast data (e.g. HRRR beyond its ~48h horizon).
    const modelIds = (Object.keys(entry.models) as WeatherModelId[]).filter(id => {
      const m = entry.models[id];
      return m && (m.wind != null || m.temperature != null || m.weather != null || m.pressure != null);
    });
    const waveModelIds = (Object.keys(entry.waveModels) as WaveModelId[]).filter(
      k => entry.waveModels[k] !== null && entry.waveModels[k] !== undefined
    );

    const breakdown: ParameterAgreement[] = [];

    // Wind speed
    const windSpeeds = modelIds
      .map(id => entry.models[id]?.wind?.speed)
      .filter((v): v is number => v != null);
    breakdown.push(computeSpreadAgreement('windSpeed', windSpeeds));

    // Wind gusts
    const windGusts = modelIds
      .map(id => entry.models[id]?.wind?.gusts)
      .filter((v): v is number => v != null);
    breakdown.push(computeSpreadAgreement('windGusts', windGusts));

    // Wave height (from wave models)
    const waveHeights = waveModelIds
      .map(id => entry.waveModels[id]?.height)
      .filter((v): v is number => v != null);
    breakdown.push(computeSpreadAgreement('waveHeight', waveHeights));

    // Precipitation (boolean consensus)
    const precipProbs = modelIds
      .map(id => entry.models[id]?.weather?.precipitationProbability)
      .filter((v): v is number => v != null);
    breakdown.push(computePrecipAgreement(precipProbs));

    // Wind direction (circular)
    const windDirs = modelIds
      .map(id => entry.models[id]?.wind?.direction)
      .filter((v): v is number => v != null);
    breakdown.push(computeDirectionAgreement(windDirs));

    // Weighted overall score — only count params with >=2 models
    let totalWeight = 0;
    let weightedScore = 0;
    for (const item of breakdown) {
      if (item.modelsCompared >= 2) {
        totalWeight += item.weight;
        weightedScore += item.agrees ? item.weight : 0;
      }
    }

    const overall = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
    const level: ConfidenceLevel =
      overall >= 80 ? 'high' : overall >= 50 ? 'moderate' : 'low';

    return {
      timestamp: entry.timestamp,
      overall,
      level,
      breakdown,
      modelsAvailable: modelIds,
      waveModelsAvailable: waveModelIds,
    };
  });
}

// ── Orchestrator ──

export async function fetchMultiModelData(
  lat: number,
  lng: number
): Promise<MultiModelData> {
  const fetchedAt = new Date().toISOString();
  const conusAvailable = isInCONUSCoverage(lat, lng);

  // Fetch weather models in parallel (each with independent error handling)
  const weatherPromises: Promise<SingleModelForecast | null>[] = [
    fetchGFSForecast(lat, lng).catch(err => {
      console.error('GFS fetch failed:', err);
      return null;
    }),
    fetchECMWFForecast(lat, lng).catch(err => {
      console.error('ECMWF fetch failed:', err);
      return null;
    }),
  ];

  if (conusAvailable) {
    weatherPromises.push(
      fetchHRRRForecast(lat, lng).catch(err => {
        console.error('HRRR fetch failed:', err);
        return null;
      }),
      fetchNAMForecast(lat, lng).catch(err => {
        console.error('NAM fetch failed:', err);
        return null;
      })
    );
  }

  // Fetch wave models in parallel
  const wavePromises: Promise<SingleWaveModelForecast | null>[] = [
    fetchWaveModelForecast(lat, lng, 'ecmwf_wam').catch(err => {
      console.error('ECMWF WAM fetch failed:', err);
      return null;
    }),
    fetchWaveModelForecast(lat, lng, 'gfs_ww3').catch(err => {
      console.error('GFS WW3 fetch failed:', err);
      return null;
    }),
  ];

  const [weatherResults, waveResults] = await Promise.all([
    Promise.all(weatherPromises),
    Promise.all(wavePromises),
  ]);

  const models = weatherResults.filter((m): m is SingleModelForecast => m !== null);

  // Filter out wave models that return all-zero heights — this happens when the
  // location falls on a land cell in that model's grid. GFS WW3 has a coarser
  // land mask (0.25°) than ECMWF WAM, so near-shore locations may be treated
  // as land by GFS WW3 but as ocean by ECMWF WAM.
  const waveModels = waveResults
    .filter((m): m is SingleWaveModelForecast => m !== null)
    .filter(m => {
      const hasNonZeroHeight = m.waves.some(w => w.height > 0);
      if (!hasNonZeroHeight && m.waves.length > 0) {
        console.warn(
          `${m.modelId}: all wave heights are zero — location likely on a land cell for this model's grid. Excluding.`
        );
        return false;
      }
      return true;
    });

  // Normalize to common time grid and compute confidence
  const normalized = normalizeToCommonGrid(models, waveModels);
  const confidence = computeConfidenceScores(normalized);

  return { models, waveModels, normalized, confidence, fetchedAt };
}
