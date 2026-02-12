import type { WeatherModelId, WaveModelId } from '../types/multiModel';

export const WEATHER_MODEL_LABELS: Record<WeatherModelId, string> = {
  gfs: 'GFS',
  ecmwf: 'ECMWF',
  hrrr: 'HRRR',
  nam: 'NAM',
};

export const WAVE_MODEL_LABELS: Record<WaveModelId, string> = {
  ecmwf_wam: 'ECMWF WAM',
  gfs_ww3: 'GFS WW3',
};

export const WEATHER_MODEL_COLORS: Record<WeatherModelId, string> = {
  gfs: '#58a6ff',
  ecmwf: '#a371f7',
  hrrr: '#f0883e',
  nam: '#3fb950',
};

export const WAVE_MODEL_COLORS: Record<WaveModelId, string> = {
  ecmwf_wam: '#a371f7',
  gfs_ww3: '#58a6ff',
};
