import { useMemo } from 'react';
import type { WindData, WaveData, WeatherData } from '../types';
import type { MultiModelData, ConfidenceLevel, WaveModelId } from '../types/multiModel';

// ── Types ──

interface ForecastSynopsisProps {
  wind: WindData[];
  waves: WaveData[] | undefined;
  weather: WeatherData[];
  multiModel: MultiModelData | null;
  selectedDay: Date;
  onCompareModels: () => void;
}

// ── Constants ──

const LEVEL_COLORS: Record<ConfidenceLevel, string> = {
  high: '#2ea043',
  moderate: '#d29922',
  low: '#f85149',
};

// Simplify 16-point compass to 8-point abbreviation
function simplifyCardinal(c: string): string {
  const map: Record<string, string> = {
    NNE: 'N', NNW: 'N',
    ENE: 'NE', ESE: 'SE',
    SSE: 'S', SSW: 'S',
    WNW: 'NW', WSW: 'SW',
  };
  return map[c] || c;
}

// ── Helpers ──

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toLocalDateStr(timestamp: string): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function filterDaylight<T extends { timestamp: string }>(
  data: T[],
  selectedDay: Date,
): T[] {
  const dayStr = formatDateStr(selectedDay);
  return data.filter(d => {
    if (toLocalDateStr(d.timestamp) !== dayStr) return false;
    const hour = new Date(d.timestamp).getHours();
    return hour >= 6 && hour <= 20;
  });
}

// Most frequent value in an array
function mode(arr: string[]): string {
  const counts: Record<string, number> = {};
  for (const v of arr) counts[v] = (counts[v] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

// Convert degrees to 16-point cardinal direction
function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// ── Synopsis generation ──

function generateSynopsis(
  wind: WindData[],
  waves: WaveData[] | undefined,
  weather: WeatherData[],
  multiModel: MultiModelData | null,
  selectedDay: Date,
): string {
  const parts: string[] = [];

  // --- Wind ---
  const dayWind = filterDaylight(wind, selectedDay);
  if (dayWind.length > 0) {
    const morningWind = dayWind.filter(w => new Date(w.timestamp).getHours() < 12);
    const afternoonWind = dayWind.filter(w => new Date(w.timestamp).getHours() >= 12);

    const allSpeeds = dayWind.map(w => w.speed);
    const minSpeed = Math.round(Math.min(...allSpeeds));
    const maxSpeed = Math.round(Math.max(...allSpeeds));

    // Dominant direction for the whole day
    const dayDirection = simplifyCardinal(mode(dayWind.map(w => w.directionCardinal)));

    // Speed range text
    const speedText = minSpeed === maxSpeed || maxSpeed - minSpeed <= 2
      ? `around ${Math.round((minSpeed + maxSpeed) / 2)} mph`
      : `${minSpeed}–${maxSpeed} mph`;

    let windSentence = `${dayDirection} winds ${speedText}`;

    // Check if afternoon direction shifts
    if (morningWind.length >= 2 && afternoonWind.length >= 2) {
      const amDir = simplifyCardinal(mode(morningWind.map(w => w.directionCardinal)));
      const pmDir = simplifyCardinal(mode(afternoonWind.map(w => w.directionCardinal)));
      if (amDir !== pmDir) {
        windSentence = `${amDir} winds ${speedText}, becoming ${pmDir} this afternoon`;
      }
    }

    // Note gusts if significantly higher
    const maxGust = Math.round(Math.max(...dayWind.map(w => w.gusts)));
    if (maxGust > maxSpeed + 5) {
      windSentence += `, gusts to ${maxGust} mph`;
    }

    parts.push(windSentence);
  }

  // --- Waves (prefer multi-model data to match the comparison modal) ---
  let waveHandled = false;
  if (multiModel && multiModel.normalized.length > 0) {
    const dayStr = formatDateStr(selectedDay);
    const daylightNorm = multiModel.normalized.filter(n => {
      if (toLocalDateStr(n.timestamp) !== dayStr) return false;
      const hour = new Date(n.timestamp).getHours();
      return hour >= 6 && hour <= 20;
    });

    // Collect all wave heights, periods, and directions from all wave models
    const allHeights: number[] = [];
    const allPeriods: number[] = [];
    const allDirCardinals: string[] = [];
    for (const ts of daylightNorm) {
      for (const modelId of Object.keys(ts.waveModels) as WaveModelId[]) {
        const wave = ts.waveModels[modelId];
        if (wave) {
          allHeights.push(wave.height);
          allPeriods.push(wave.period);
          allDirCardinals.push(simplifyCardinal(degreesToCardinal(wave.direction)));
        }
      }
    }

    if (allHeights.length > 0) {
      const minHeight = Math.min(...allHeights);
      const maxHeight = Math.max(...allHeights);
      const avgPeriod = allPeriods.reduce((s, p) => s + p, 0) / allPeriods.length;
      const waveDir = mode(allDirCardinals);

      const minStr = minHeight.toFixed(1);
      const maxStr = maxHeight.toFixed(1);
      const heightStr = minStr === maxStr ? minStr : `${minStr}–${maxStr}`;
      const periodStr = Math.round(avgPeriod);

      parts.push(`Waves ${heightStr} ft, ${waveDir}, period: ${periodStr}s`);
      waveHandled = true;
    }
  }

  // Fallback to primary wave data if no multi-model data
  if (!waveHandled) {
    const dayWaves = waves ? filterDaylight(waves, selectedDay) : [];
    if (dayWaves.length > 0) {
      const heights = dayWaves.map(w => w.height);
      const minHeight = Math.min(...heights);
      const maxHeight = Math.max(...heights);
      const avgPeriod = dayWaves.reduce((s, w) => s + w.period, 0) / dayWaves.length;
      const waveDir = simplifyCardinal(mode(dayWaves.map(w => w.directionCardinal)));

      const minStr = minHeight.toFixed(1);
      const maxStr = maxHeight.toFixed(1);
      const heightStr = minStr === maxStr ? minStr : `${minStr}–${maxStr}`;
      const periodStr = Math.round(avgPeriod);

      parts.push(`Waves ${heightStr} ft, ${waveDir}, period: ${periodStr}s`);
    }
  }

  // --- Precipitation ---
  const dayWeather = filterDaylight(weather, selectedDay);
  if (dayWeather.length > 0) {
    const avgPrecip = dayWeather.reduce((s, w) => s + w.precipitationProbability, 0) / dayWeather.length;
    if (avgPrecip >= 70) {
      parts.push('Rain likely');
    } else if (avgPrecip >= 40) {
      // Check morning vs afternoon
      const amWeather = dayWeather.filter(w => new Date(w.timestamp).getHours() < 12);
      const pmWeather = dayWeather.filter(w => new Date(w.timestamp).getHours() >= 12);
      const amAvg = amWeather.length > 0
        ? amWeather.reduce((s, w) => s + w.precipitationProbability, 0) / amWeather.length
        : 0;
      const pmAvg = pmWeather.length > 0
        ? pmWeather.reduce((s, w) => s + w.precipitationProbability, 0) / pmWeather.length
        : 0;

      if (pmAvg > amAvg + 15) {
        parts.push('Chance of showers this afternoon');
      } else if (amAvg > pmAvg + 15) {
        parts.push('Chance of showers this morning');
      } else {
        parts.push('Chance of showers');
      }
    }
  }

  return parts.join('. ') + (parts.length > 0 ? '.' : '');
}

// ── Confidence summary ──

function computeDayConfidence(
  multiModel: MultiModelData | null,
  selectedDay: Date,
): { level: ConfidenceLevel; overall: number; modelCount: number } | null {
  if (!multiModel) return null;

  const dayStr = formatDateStr(selectedDay);
  const daylightScores = multiModel.confidence.filter(s => {
    if (toLocalDateStr(s.timestamp) !== dayStr) return false;
    const hour = new Date(s.timestamp).getHours();
    return hour >= 6 && hour <= 20;
  });

  if (daylightScores.length === 0) return null;

  // Find worst confidence hour (same logic as ConfidenceBadge)
  const scored = daylightScores.map(s => {
    let totalWeight = 0;
    let weightedScore = 0;
    for (const b of s.breakdown) {
      if (b.modelsCompared >= 2) {
        totalWeight += b.weight;
        weightedScore += b.agrees ? b.weight : 0;
      }
    }
    const overall = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
    return { ...s, overall, hasData: totalWeight > 0 };
  });

  const comparable = scored.filter(s => s.hasData);
  if (comparable.length === 0) return null;

  const worst = comparable.reduce((w, s) => s.overall < w.overall ? s : w);
  const level: ConfidenceLevel =
    worst.overall >= 80 ? 'high' : worst.overall >= 50 ? 'moderate' : 'low';

  // Model count — max available across the day
  const maxModels = Math.max(...daylightScores.map(s => s.modelsAvailable.length));

  return { level, overall: worst.overall, modelCount: maxModels };
}

// ── Component ──

export default function ForecastSynopsis({
  wind,
  waves,
  weather,
  multiModel,
  selectedDay,
  onCompareModels,
}: ForecastSynopsisProps) {
  const synopsis = useMemo(
    () => generateSynopsis(wind, waves, weather, multiModel, selectedDay),
    [wind, waves, weather, multiModel, selectedDay],
  );

  const confidence = useMemo(
    () => computeDayConfidence(multiModel, selectedDay),
    [multiModel, selectedDay],
  );

  if (!synopsis && !confidence) return null;

  const confidenceText = confidence
    ? confidence.level === 'high'
      ? `${confidence.modelCount} models agree`
      : confidence.level === 'moderate'
        ? 'Models vary'
        : 'Models disagree'
    : null;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.75rem 1rem',
        marginBottom: '0.5rem',
        fontSize: '0.85rem',
        lineHeight: 1.6,
        color: 'var(--color-text-secondary)',
      }}
    >
      {/* Confidence lead-in */}
      {confidence && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginRight: '6px',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: LEVEL_COLORS[confidence.level],
            boxShadow: `0 0 4px ${LEVEL_COLORS[confidence.level]}`,
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span style={{
            fontWeight: 600,
            color: LEVEL_COLORS[confidence.level],
            marginRight: '2px',
          }}>
            {confidenceText}
          </span>
          <span style={{ color: 'var(--color-border)', margin: '0 2px' }}>—</span>
        </span>
      )}

      {/* Synopsis text */}
      {synopsis && <span>{synopsis}</span>}

      {/* CTA */}
      {confidence && (
        <div style={{ marginTop: '0.5rem' }}>
          <button
            onClick={onCompareModels}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'rgba(88, 166, 255, 0.18)',
              color: '#58a6ff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#58a6ff';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(88, 166, 255, 0.18)';
              e.currentTarget.style.color = '#58a6ff';
            }}
          >
            Compare all {confidence.modelCount} Weather Models &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
}
