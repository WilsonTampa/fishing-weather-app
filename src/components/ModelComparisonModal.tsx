import { useMemo, useEffect, useRef, useCallback, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type {
  MultiModelData,
  WeatherModelId,
  WaveModelId,
  ConfidenceLevel,
  ConfidenceParameter,
} from '../types/multiModel';
import {
  WEATHER_MODEL_LABELS,
  WAVE_MODEL_LABELS,
  WEATHER_MODEL_COLORS,
  WAVE_MODEL_COLORS,
} from '../utils/modelConstants';
import './ModelComparisonModal.css';

// ── Agreement thresholds (same as in multiModelApi.ts confidence scoring) ──
const THRESHOLDS: Record<string, number> = {
  windSpeed: 5,
  windGusts: 8,
  waveHeight: 2,
  windDirection: 30,
  precipitation: 30,
  temperature: 5,
  pressure: 0.1,
  wavePeriod: 3,
};

// ── Confidence colors (same as ConfidenceBadge) ──
const LEVEL_COLORS: Record<ConfidenceLevel, string> = {
  high: '#2ea043',
  moderate: '#d29922',
  low: '#f85149',
};

// ── Props ──
interface ModelComparisonModalProps {
  multiModelData: MultiModelData;
  selectedDay: Date;
  onClose: () => void;
  previewMode?: boolean;
  onUpgrade?: () => void;
  onSignup?: () => void;
}

// ── Types for table rendering ──
interface MetricRow {
  label: string;
  unit: string;
  getValue: (ts: any, modelId: string) => number | null | undefined;
  getAllValues: (ts: any, modelIds: string[]) => (number | null | undefined)[];
  threshold: number;
  format: (v: number) => string;
  isDirection?: boolean;
}

// ── Component ──
export default function ModelComparisonModal({
  multiModelData,
  selectedDay,
  onClose,
  previewMode,
  onUpgrade,
  onSignup,
}: ModelComparisonModalProps) {
  const { user } = useAuth();

  // Preview mode: trigger upgrade/signup after 5s or on first interaction
  const previewTriggered = useRef(false);
  const triggerPreviewUpgrade = useCallback(() => {
    if (!previewMode || previewTriggered.current) return;
    previewTriggered.current = true;
    if (user) {
      onUpgrade?.();
    } else {
      onSignup?.();
    }
  }, [previewMode, user, onUpgrade, onSignup]);

  useEffect(() => {
    if (!previewMode) return;
    const timer = setTimeout(triggerPreviewUpgrade, 5000);
    return () => clearTimeout(timer);
  }, [previewMode, triggerPreviewUpgrade]);

  const handlePreviewInteraction = useCallback(() => {
    if (previewMode && !previewTriggered.current) {
      triggerPreviewUpgrade();
    }
  }, [previewMode, triggerPreviewUpgrade]);
  // Build a local YYYY-MM-DD string to match timestamps against the selected day
  const selectedDayStr = useMemo(() => {
    const y = selectedDay.getFullYear();
    const m = String(selectedDay.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDay.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDay]);

  // Check if a UTC timestamp falls on the selected local day
  const isSelectedDay = (timestamp: string): boolean => {
    const d = new Date(timestamp);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}` === selectedDayStr;
  };

  // Filter normalized data to selected day, daylight hours, 2-hour intervals
  const timeSlots = useMemo(() => {
    return multiModelData.normalized.filter(n => {
      if (!isSelectedDay(n.timestamp)) return false;
      const hour = new Date(n.timestamp).getHours();
      return hour >= 6 && hour <= 20 && hour % 2 === 0;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiModelData.normalized, selectedDayStr]);

  // Hourly data for the chart (every hour, not just 2-hour intervals)
  const hourlySlots = useMemo(() => {
    return multiModelData.normalized.filter(n => {
      if (!isSelectedDay(n.timestamp)) return false;
      const hour = new Date(n.timestamp).getHours();
      return hour >= 6 && hour <= 20;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiModelData.normalized, selectedDayStr]);

  // Get available model IDs from the data
  const weatherModelIds = useMemo(() => {
    const ids = new Set<WeatherModelId>();
    // Use hourly data (superset of timeSlots) for model detection
    for (const ts of hourlySlots) {
      for (const id of Object.keys(ts.models) as WeatherModelId[]) {
        ids.add(id);
      }
    }
    const order: WeatherModelId[] = ['gfs', 'ecmwf', 'hrrr', 'nam'];
    return order.filter(id => ids.has(id));
  }, [hourlySlots]);

  const waveModelIds = useMemo(() => {
    const ids = new Set<WaveModelId>();
    for (const ts of hourlySlots) {
      for (const id of Object.keys(ts.waveModels) as WaveModelId[]) {
        ids.add(id);
      }
    }
    const order: WaveModelId[] = ['ecmwf_wam', 'gfs_ww3'];
    return order.filter(id => ids.has(id));
  }, [hourlySlots]);

  // Determine which models are missing for this day and why
  const missingModels = useMemo(() => {
    const allWeather: WeatherModelId[] = ['gfs', 'ecmwf', 'hrrr', 'nam'];
    const allWave: WaveModelId[] = ['ecmwf_wam', 'gfs_ww3'];
    const missing: { label: string; reason: string }[] = [];

    for (const id of allWeather) {
      if (!weatherModelIds.includes(id)) {
        const model = multiModelData.models.find(m => m.modelId === id);
        if (!model) {
          // Model wasn't fetched at all (e.g., outside HRRR coverage)
          missing.push({ label: WEATHER_MODEL_LABELS[id], reason: 'not available for this location' });
        } else {
          // Model was fetched but doesn't cover this day
          const through = new Date(model.availableThrough);
          const daysOut = Math.ceil((through.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          missing.push({
            label: WEATHER_MODEL_LABELS[id],
            reason: `only forecasts ~${Math.max(1, daysOut)} day${daysOut !== 1 ? 's' : ''} ahead`,
          });
        }
      }
    }

    for (const id of allWave) {
      if (!waveModelIds.includes(id)) {
        const model = multiModelData.waveModels.find(m => m.modelId === id);
        if (!model) {
          missing.push({ label: WAVE_MODEL_LABELS[id], reason: 'not available' });
        } else {
          const through = new Date(model.availableThrough);
          const daysOut = Math.ceil((through.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          missing.push({
            label: WAVE_MODEL_LABELS[id],
            reason: `only forecasts ~${Math.max(1, daysOut)} day${daysOut !== 1 ? 's' : ''} ahead`,
          });
        }
      }
    }

    return missing;
  }, [weatherModelIds, waveModelIds, multiModelData.models, multiModelData.waveModels]);

  // Compute section-level confidence from daylight scores
  const sectionConfidence = useMemo(() => {
    const dayScores = multiModelData.confidence.filter(s => {
      if (!isSelectedDay(s.timestamp)) return false;
      const hour = new Date(s.timestamp).getHours();
      return hour >= 6 && hour <= 20;
    });

    function getWorstLevel(params: ConfidenceParameter[]): ConfidenceLevel {
      let worstScore = 100;
      for (const s of dayScores) {
        const relevant = s.breakdown.filter(
          b => params.includes(b.parameter) && b.modelsCompared >= 2
        );
        if (relevant.length === 0) continue;
        let tw = 0, ws = 0;
        for (const b of relevant) {
          tw += b.weight;
          ws += b.agrees ? b.weight : 0;
        }
        const score = tw > 0 ? Math.round((ws / tw) * 100) : 0;
        if (score < worstScore) worstScore = score;
      }
      return worstScore >= 80 ? 'high' : worstScore >= 50 ? 'moderate' : 'low';
    }

    return {
      wind: getWorstLevel(['windSpeed', 'windGusts', 'windDirection']),
      waves: getWorstLevel(['waveHeight']),
      temperature: 'high' as ConfidenceLevel,
      precipitation: getWorstLevel(['precipitation']),
      pressure: 'high' as ConfidenceLevel,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiModelData.confidence, selectedDayStr]);

  // Format hour label
  const formatHour = (timestamp: string): string => {
    const h = new Date(timestamp).getHours();
    if (h === 0 || h === 24) return '12AM';
    if (h === 12) return '12PM';
    return h > 12 ? `${h - 12}PM` : `${h}AM`;
  };

  // Format the selected day for the header
  const dayLabel = selectedDay.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // ── Wind speed chart data (hourly, one key per model) ──
  const windChartData = useMemo(() => {
    return hourlySlots.map(ts => {
      const hour = new Date(ts.timestamp).getHours();
      const entry: Record<string, any> = {
        hour,
        timeLabel: formatHour(ts.timestamp),
      };
      for (const modelId of weatherModelIds) {
        const speed = ts.models[modelId]?.wind?.speed;
        entry[modelId] = speed != null ? Math.round(speed) : null;
        // Store gusts and direction for tooltip / arrows
        const gusts = ts.models[modelId]?.wind?.gusts;
        entry[`${modelId}_gusts`] = gusts != null ? Math.round(gusts) : null;
        const dir = ts.models[modelId]?.wind?.direction;
        entry[`${modelId}_dir`] = dir ?? null;
      }
      return entry;
    });
  }, [hourlySlots, weatherModelIds]);

  // Y-axis domain for wind chart
  const windYMax = useMemo(() => {
    let max = 0;
    for (const d of windChartData) {
      for (const modelId of weatherModelIds) {
        const speed = d[modelId];
        const gusts = d[`${modelId}_gusts`];
        if (speed != null && speed > max) max = speed;
        if (gusts != null && gusts > max) max = gusts;
      }
    }
    return Math.ceil(max / 5) * 5 + 5; // Round up to nearest 5, plus padding
  }, [windChartData, weatherModelIds]);

  // Wind direction arrow dot — shown every 3 hours to avoid clutter
  const makeWindArrowDot = (modelId: WeatherModelId) => {
    const color = WEATHER_MODEL_COLORS[modelId];
    const dirKey = `${modelId}_dir`;

    return (props: any) => {
      const { cx, cy, payload } = props;
      if (!payload || cx == null || cy == null) return null;

      const dir = payload[dirKey];
      const hour = payload.hour;
      // Show arrows every 3 hours starting from 6AM
      if (dir == null || (hour - 6) % 3 !== 0) return null;

      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <g transform={`rotate(${dir + 180})`}>
            <path
              d="M0,-10 L4,0 L0,-2.5 L-4,0 Z"
              fill={color}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="0.7"
            />
            <line x1="0" y1="-2.5" x2="0" y2="7" stroke={color} strokeWidth="1.8" />
          </g>
        </g>
      );
    };
  };

  // Memoize dot renderers so React doesn't recreate them each render
  const windArrowDots = useMemo(() => {
    const dots: Record<WeatherModelId, (props: any) => any> = {} as any;
    for (const id of weatherModelIds) {
      dots[id] = makeWindArrowDot(id);
    }
    return dots;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherModelIds.join(',')]);

  // Custom tooltip for the wind chart
  const WindChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.5rem 0.75rem',
        fontSize: '0.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
          {data.timeLabel}
        </div>
        {weatherModelIds.map(modelId => {
          const speed = data[modelId];
          const gusts = data[`${modelId}_gusts`];
          const dir = data[`${modelId}_dir`];
          if (speed == null) return null;
          const cardinal = dir != null ? degreesToCardinal(dir) : '';
          return (
            <div key={modelId} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{
                width: '8px', height: '3px', borderRadius: '1px',
                backgroundColor: WEATHER_MODEL_COLORS[modelId], display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ color: WEATHER_MODEL_COLORS[modelId], fontWeight: 500 }}>
                {WEATHER_MODEL_LABELS[modelId]}
              </span>
              <span style={{ color: 'var(--color-text)' }}>
                {speed} mph{cardinal ? ` ${cardinal}` : ''}
              </span>
              {gusts != null && gusts > speed && (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.65rem' }}>
                  gusts {gusts}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Wave height chart data (hourly, one key per wave model) ──
  const waveChartData = useMemo(() => {
    return hourlySlots.map(ts => {
      const hour = new Date(ts.timestamp).getHours();
      const entry: Record<string, any> = {
        hour,
        timeLabel: formatHour(ts.timestamp),
      };
      for (const modelId of waveModelIds) {
        const wave = ts.waveModels[modelId];
        entry[modelId] = wave?.height != null ? Number(wave.height.toFixed(1)) : null;
        entry[`${modelId}_period`] = wave?.period != null ? Number(wave.period.toFixed(1)) : null;
        entry[`${modelId}_dir`] = wave?.direction ?? null;
      }
      return entry;
    });
  }, [hourlySlots, waveModelIds]);

  // Y-axis domain for wave chart
  const waveYMax = useMemo(() => {
    let max = 0;
    for (const d of waveChartData) {
      for (const modelId of waveModelIds) {
        const h = d[modelId];
        if (h != null && h > max) max = h;
      }
    }
    return Math.ceil(max) + 1; // Round up + 1ft padding
  }, [waveChartData, waveModelIds]);

  // Wave direction arrow dot — shown every 3 hours
  const makeWaveArrowDot = (modelId: WaveModelId) => {
    const color = WAVE_MODEL_COLORS[modelId];
    const dirKey = `${modelId}_dir`;

    return (props: any) => {
      const { cx, cy, payload } = props;
      if (!payload || cx == null || cy == null) return null;

      const dir = payload[dirKey];
      const hour = payload.hour;
      if (dir == null || (hour - 6) % 3 !== 0) return null;

      return (
        <g transform={`translate(${cx}, ${cy})`}>
          <g transform={`rotate(${dir + 180})`}>
            <path
              d="M0,-10 L4,0 L0,-2.5 L-4,0 Z"
              fill={color}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="0.7"
            />
            <line x1="0" y1="-2.5" x2="0" y2="7" stroke={color} strokeWidth="1.8" />
          </g>
        </g>
      );
    };
  };

  // Memoize wave dot renderers
  const waveArrowDots = useMemo(() => {
    const dots: Record<WaveModelId, (props: any) => any> = {} as any;
    for (const id of waveModelIds) {
      dots[id] = makeWaveArrowDot(id);
    }
    return dots;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveModelIds.join(',')]);

  // Custom tooltip for the wave chart
  const WaveChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.5rem 0.75rem',
        fontSize: '0.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
          {data.timeLabel}
        </div>
        {waveModelIds.map(modelId => {
          const height = data[modelId];
          const period = data[`${modelId}_period`];
          const dir = data[`${modelId}_dir`];
          if (height == null) return null;
          const cardinal = dir != null ? degreesToCardinal(dir) : '';
          return (
            <div key={modelId} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{
                width: '8px', height: '3px', borderRadius: '1px',
                backgroundColor: WAVE_MODEL_COLORS[modelId], display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ color: WAVE_MODEL_COLORS[modelId], fontWeight: 500 }}>
                {WAVE_MODEL_LABELS[modelId]}
              </span>
              <span style={{ color: 'var(--color-text)' }}>
                {height} ft{cardinal ? ` ${cardinal}` : ''}
              </span>
              {period != null && (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.65rem' }}>
                  {period}s
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Compute spread for a set of values
  const getSpread = (values: (number | null | undefined)[]): number => {
    const valid = values.filter((v): v is number => v != null);
    if (valid.length < 2) return 0;
    return Math.max(...valid) - Math.min(...valid);
  };

  // Check if a value is the max or min outlier in a disagreeing set
  const isOutlier = (
    value: number | null | undefined,
    allValues: (number | null | undefined)[],
    threshold: number
  ): boolean => {
    if (value == null) return false;
    const valid = allValues.filter((v): v is number => v != null);
    if (valid.length < 2) return false;
    const spread = Math.max(...valid) - Math.min(...valid);
    if (spread <= threshold) return false;
    return value === Math.max(...valid) || value === Math.min(...valid);
  };

  // Render a standard data cell
  const renderCell = (
    value: number | null | undefined,
    allValues: (number | null | undefined)[],
    threshold: number,
    format: (v: number) => string,
    key: string
  ) => {
    if (value == null) {
      return <td key={key} className="model-comparison-cell--missing">&mdash;</td>;
    }
    const spread = getSpread(allValues);
    const disagrees = spread > threshold && allValues.filter(v => v != null).length >= 2;
    const outlier = isOutlier(value, allValues, threshold);

    const className = [
      disagrees ? 'model-comparison-cell--disagree' : '',
      outlier ? 'model-comparison-cell--outlier' : '',
    ].filter(Boolean).join(' ') || undefined;

    return <td key={key} className={className}>{format(value)}</td>;
  };

  // Render direction cell with small arrow
  const renderDirectionCell = (
    degrees: number | null | undefined,
    allValues: (number | null | undefined)[],
    threshold: number,
    key: string
  ) => {
    if (degrees == null) {
      return <td key={key} className="model-comparison-cell--missing">&mdash;</td>;
    }

    const valid = allValues.filter((v): v is number => v != null);
    const spread = valid.length >= 2 ? circularSpread(valid) : 0;
    const disagrees = spread > threshold && valid.length >= 2;
    const cardinal = degreesToCardinal(degrees);

    return (
      <td key={key} className={disagrees ? 'model-comparison-cell--disagree' : undefined}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: `rotate(${degrees + 180}deg)`, flexShrink: 0 }}>
            <path d="M6,1 L8,5 L6,4 L4,5 Z" fill="currentColor" />
            <line x1="6" y1="4" x2="6" y2="10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          {cardinal}
        </span>
      </td>
    );
  };

  // ── Generic section renderer ──
  const renderSection = (config: {
    title: string;
    confidence: ConfidenceLevel;
    modelIds: string[];
    modelLabels: Record<string, string>;
    modelColors: Record<string, string>;
    metrics: MetricRow[];
  }) => {
    if (config.modelIds.length === 0) return null;

    return (
      <div className="model-comparison-section">
        <div className="model-comparison-section__header">
          <span
            className="model-comparison-section__confidence"
            style={{ backgroundColor: LEVEL_COLORS[config.confidence] }}
            title={`${config.title} confidence: ${config.confidence}`}
          />
          <h3 className="model-comparison-section__title">{config.title}</h3>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem', opacity: 0.7 }}>
            {config.modelIds.length} models
          </span>
        </div>
        <div className="model-comparison-table-scroll">
          <table className="model-comparison-table">
            <thead>
              <tr>
                <th className="model-comparison-cell--label" />
                {timeSlots.map(ts => (
                  <th key={ts.timestamp}>{formatHour(ts.timestamp)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.metrics.map(metric => (
                <Fragment key={`metric-${metric.label}`}>
                  {/* Metric sub-header */}
                  <tr>
                    <td
                      className="model-comparison-cell--metric"
                      colSpan={timeSlots.length + 1}
                      style={{
                        borderBottom: 'none',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.15rem',
                        fontSize: '0.7rem',
                        color: 'var(--color-text-secondary)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {metric.label} <span style={{ fontWeight: 400, opacity: 0.7 }}>({metric.unit})</span>
                    </td>
                  </tr>
                  {/* One row per model */}
                  {config.modelIds.map(modelId => (
                    <tr key={`${metric.label}-${modelId}`}>
                      <td className="model-comparison-cell--label">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            backgroundColor: config.modelColors[modelId],
                            display: 'inline-block', flexShrink: 0,
                          }} />
                          <span style={{ color: config.modelColors[modelId], fontSize: '0.7rem' }}>
                            {config.modelLabels[modelId]}
                          </span>
                        </span>
                      </td>
                      {timeSlots.map(ts => {
                        const allValues = metric.getAllValues(ts, config.modelIds);
                        const value = metric.getValue(ts, modelId);
                        const cellKey = `${metric.label}-${modelId}-${ts.timestamp}`;

                        if (metric.isDirection) {
                          return renderDirectionCell(value, allValues, metric.threshold, cellKey);
                        }
                        return renderCell(value, allValues, metric.threshold, metric.format, cellKey);
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Section definitions ──

  // Wind table removed — replaced by wind speed chart above

  const temperatureSection = renderSection({
    title: 'Temperature',
    confidence: sectionConfidence.temperature,
    modelIds: weatherModelIds,
    modelLabels: WEATHER_MODEL_LABELS,
    modelColors: WEATHER_MODEL_COLORS,
    metrics: [
      {
        label: 'Temp', unit: '°F',
        getValue: (ts, id) => ts.models[id]?.temperature?.temperature,
        getAllValues: (ts, ids) => ids.map((id: string) => ts.models[id]?.temperature?.temperature),
        threshold: THRESHOLDS.temperature,
        format: (v: number) => `${Math.round(v)}°`,
      },
      {
        label: 'Feels Like', unit: '°F',
        getValue: (ts, id) => ts.models[id]?.temperature?.feelsLike,
        getAllValues: (ts, ids) => ids.map((id: string) => ts.models[id]?.temperature?.feelsLike),
        threshold: THRESHOLDS.temperature,
        format: (v: number) => `${Math.round(v)}°`,
      },
    ],
  });

  const precipitationSection = renderSection({
    title: 'Precipitation',
    confidence: sectionConfidence.precipitation,
    modelIds: weatherModelIds,
    modelLabels: WEATHER_MODEL_LABELS,
    modelColors: WEATHER_MODEL_COLORS,
    metrics: [
      {
        label: 'Probability', unit: '%',
        getValue: (ts, id) => ts.models[id]?.weather?.precipitationProbability,
        getAllValues: (ts, ids) => ids.map((id: string) => ts.models[id]?.weather?.precipitationProbability),
        threshold: THRESHOLDS.precipitation,
        format: (v: number) => `${Math.round(v)}%`,
      },
    ],
  });

  const pressureSection = renderSection({
    title: 'Pressure',
    confidence: sectionConfidence.pressure,
    modelIds: weatherModelIds,
    modelLabels: WEATHER_MODEL_LABELS,
    modelColors: WEATHER_MODEL_COLORS,
    metrics: [
      {
        label: 'Barometric', unit: 'inHg',
        getValue: (ts, id) => ts.models[id]?.pressure?.pressure,
        getAllValues: (ts, ids) => ids.map((id: string) => ts.models[id]?.pressure?.pressure),
        threshold: THRESHOLDS.pressure,
        format: (v: number) => v.toFixed(2),
      },
    ],
  });

  if (timeSlots.length === 0) {
    return (
      <div className="model-comparison-overlay" onClick={onClose}>
        <div className="model-comparison-modal" onClick={e => e.stopPropagation()}>
          <div className="model-comparison-header">
            <h2 className="model-comparison-header__title">
              Model Comparison
              <span className="model-comparison-header__date">&mdash; {dayLabel}</span>
            </h2>
            <button className="model-comparison-header__close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="model-comparison-body" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            No model comparison data available for this day.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="model-comparison-overlay" onClick={onClose}>
      <div className="model-comparison-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="model-comparison-header">
          <h2 className="model-comparison-header__title">
            Model Comparison
            <span className="model-comparison-header__date">&mdash; {dayLabel}</span>
            {previewMode && <span className="model-comparison-preview-badge">Preview</span>}
          </h2>
          <button className="model-comparison-header__close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div
          className="model-comparison-body"
          onScroll={handlePreviewInteraction}
          onClick={handlePreviewInteraction}
          onMouseMove={handlePreviewInteraction}
        >
          {/* Wind Speed Comparison Chart */}
          {windChartData.length > 0 && weatherModelIds.length > 0 && (
            <div className="model-comparison-section">
              <div className="model-comparison-section__header">
                <span
                  className="model-comparison-section__confidence"
                  style={{ backgroundColor: LEVEL_COLORS[sectionConfidence.wind] }}
                />
                <h3 className="model-comparison-section__title">Wind Speed</h3>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem', opacity: 0.7 }}>
                  {weatherModelIds.length} models
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>mph</span>
              </div>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={windChartData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="hour"
                      stroke="var(--color-text-secondary)"
                      style={{ fontSize: '0.65rem' }}
                      tickFormatter={(h: number) => {
                        if (h === 0 || h === 24) return '12AM';
                        if (h === 12) return '12PM';
                        return h > 12 ? `${h - 12}PM` : `${h}AM`;
                      }}
                      type="number"
                      domain={[6, 20]}
                      ticks={[6, 9, 12, 15, 18]}
                    />
                    <YAxis
                      stroke="var(--color-text-secondary)"
                      style={{ fontSize: '0.65rem' }}
                      domain={[0, windYMax]}
                      tickCount={5}
                    />
                    <Tooltip content={<WindChartTooltip />} />
                    {weatherModelIds.map(modelId => (
                      <Line
                        key={modelId}
                        type="monotone"
                        dataKey={modelId}
                        stroke={WEATHER_MODEL_COLORS[modelId]}
                        strokeWidth={2}
                        dot={windArrowDots[modelId]}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                      />
                    ))}
                    {/* Gust lines — dotted, same color, thinner */}
                    {weatherModelIds.map(modelId => (
                      <Line
                        key={`${modelId}_gusts`}
                        type="monotone"
                        dataKey={`${modelId}_gusts`}
                        stroke={WEATHER_MODEL_COLORS[modelId]}
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                        dot={false}
                        activeDot={false}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '4px', flexWrap: 'wrap' }}>
                {weatherModelIds.map(modelId => (
                  <span key={modelId} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                    <span style={{
                      width: '12px', height: '3px', borderRadius: '1px',
                      backgroundColor: WEATHER_MODEL_COLORS[modelId], display: 'inline-block',
                    }} />
                    <span style={{ color: WEATHER_MODEL_COLORS[modelId], fontWeight: 500 }}>
                      {WEATHER_MODEL_LABELS[modelId]}
                    </span>
                  </span>
                ))}
                {/* Gusts legend entry */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                  <svg width="16" height="3" viewBox="0 0 16 3">
                    <line x1="0" y1="1.5" x2="16" y2="1.5" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeDasharray="3 3" />
                  </svg>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    Gusts
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Wave Height Comparison Chart */}
          {waveChartData.length > 0 && waveModelIds.length > 0 && (
            <div className="model-comparison-section">
              <div className="model-comparison-section__header">
                <span
                  className="model-comparison-section__confidence"
                  style={{ backgroundColor: LEVEL_COLORS[sectionConfidence.waves] }}
                />
                <h3 className="model-comparison-section__title">Wave Height</h3>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem', opacity: 0.7 }}>
                  {waveModelIds.length} models
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>ft</span>
              </div>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={waveChartData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="hour"
                      stroke="var(--color-text-secondary)"
                      style={{ fontSize: '0.65rem' }}
                      tickFormatter={(h: number) => {
                        if (h === 0 || h === 24) return '12AM';
                        if (h === 12) return '12PM';
                        return h > 12 ? `${h - 12}PM` : `${h}AM`;
                      }}
                      type="number"
                      domain={[6, 20]}
                      ticks={[6, 9, 12, 15, 18]}
                    />
                    <YAxis
                      stroke="var(--color-text-secondary)"
                      style={{ fontSize: '0.65rem' }}
                      domain={[0, waveYMax]}
                      tickCount={5}
                    />
                    <Tooltip content={<WaveChartTooltip />} />
                    {waveModelIds.map(modelId => (
                      <Line
                        key={modelId}
                        type="monotone"
                        dataKey={modelId}
                        stroke={WAVE_MODEL_COLORS[modelId]}
                        strokeWidth={2}
                        dot={waveArrowDots[modelId]}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '4px', flexWrap: 'wrap' }}>
                {waveModelIds.map(modelId => (
                  <span key={modelId} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                    <span style={{
                      width: '12px', height: '3px', borderRadius: '1px',
                      backgroundColor: WAVE_MODEL_COLORS[modelId], display: 'inline-block',
                    }} />
                    <span style={{ color: WAVE_MODEL_COLORS[modelId], fontWeight: 500 }}>
                      {WAVE_MODEL_LABELS[modelId]}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {temperatureSection}
          {precipitationSection}
          {pressureSection}
        </div>

        {/* Footer */}
        <div className="model-comparison-footer">
          {missingModels.length > 0 && (
            <div style={{ marginBottom: '0.35rem', color: 'var(--color-text-secondary)', opacity: 0.8 }}>
              {missingModels.map(m => `${m.label}: ${m.reason}`).join(' · ')}
            </div>
          )}
          Data from Open-Meteo &middot; Last updated {new Date(multiModelData.fetchedAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──

function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function circularSpread(values: number[]): number {
  if (values.length < 2) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    maxGap = Math.max(maxGap, sorted[i] - sorted[i - 1]);
  }
  const wrapGap = 360 - sorted[sorted.length - 1] + sorted[0];
  maxGap = Math.max(maxGap, wrapGap);
  return 360 - maxGap;
}
