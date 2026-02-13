import { useState, useRef, useEffect } from 'react';
import type {
  ConfidenceScore,
  ConfidenceLevel,
  ConfidenceParameter,
  ParameterAgreement,
  WeatherModelId,
  WaveModelId,
} from '../types/multiModel';

// ── Config ──

const LEVEL_COLORS: Record<ConfidenceLevel, string> = {
  high: '#2ea043',
  moderate: '#d29922',
  low: '#f85149',
};

const LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  high: 'High Confidence',
  moderate: 'Models Vary',
  low: 'Low Confidence',
};

const PARAM_LABELS: Record<ConfidenceParameter, string> = {
  windSpeed: 'Wind speed',
  windGusts: 'Wind gusts',
  waveHeight: 'Wave height',
  precipitation: 'Precipitation',
  windDirection: 'Wind direction',
};

const PARAM_UNITS: Record<ConfidenceParameter, string> = {
  windSpeed: 'mph',
  windGusts: 'mph',
  waveHeight: 'ft',
  precipitation: '%',
  windDirection: '\u00B0', // °
};

const MODEL_LABELS: Record<WeatherModelId, string> = {
  gfs: 'GFS',
  ecmwf: 'ECMWF',
  hrrr: 'HRRR',
  nam: 'NAM',
};

const WAVE_MODEL_LABELS: Record<WaveModelId, string> = {
  ecmwf_wam: 'ECMWF WAM',
  gfs_ww3: 'GFS WW3',
};

// Parameters that use wave models instead of weather models
const WAVE_PARAMS: ConfidenceParameter[] = ['waveHeight'];

// ── Props ──

interface ConfidenceBadgeProps {
  confidenceScores: ConfidenceScore[];
  selectedDay: Date;
  relevantParams?: ConfidenceParameter[];
  onCompareModels?: () => void;
}

// ── Component ──

export default function ConfidenceBadge({
  confidenceScores,
  selectedDay,
  relevantParams,
  onCompareModels,
}: ConfidenceBadgeProps) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showPopover) return;

    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(e.target as Node)
      ) {
        setShowPopover(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPopover]);

  // Filter scores to selected day, daylight hours (6AM–8PM)
  const dayStr = formatDateStr(selectedDay);
  const daylightScores = confidenceScores.filter(s => {
    if (toLocalDateStr(s.timestamp) !== dayStr) return false;
    const hour = new Date(s.timestamp).getHours();
    return hour >= 6 && hour <= 20;
  });

  if (daylightScores.length === 0) return null;

  // Filter to relevant params if specified
  const filteredScores = relevantParams
    ? daylightScores.map(s => ({
        ...s,
        breakdown: s.breakdown.filter(b => relevantParams.includes(b.parameter)),
      }))
    : daylightScores;

  // Recompute per-score level based on filtered params
  const scoredFiltered = filteredScores.map(s => {
    let totalWeight = 0;
    let weightedScore = 0;
    for (const b of s.breakdown) {
      if (b.modelsCompared >= 2) {
        totalWeight += b.weight;
        weightedScore += b.agrees ? b.weight : 0;
      }
    }
    const overall = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
    const level: ConfidenceLevel =
      overall >= 80 ? 'high' : overall >= 50 ? 'moderate' : 'low';
    return { ...s, overall, level, hasComparableData: totalWeight > 0 };
  });

  // If none of the hours have enough models (≥2) for comparison on the
  // relevant params, don't show a confidence badge — we simply don't have
  // enough data to assess agreement.
  const anyComparable = scoredFiltered.some(s => s.hasComparableData);
  if (!anyComparable) return null;

  // Find worst confidence (day-level summary)
  // Only consider hours that actually have comparable data
  const comparableScores = scoredFiltered.filter(s => s.hasComparableData);
  const worstScore = (comparableScores.length > 0 ? comparableScores : scoredFiltered)
    .reduce((worst, s) => s.overall < worst.overall ? s : worst);

  // All daylight scores for the timeline (use original unfiltered for timeline colors)
  const timelineScores = daylightScores;

  // Determine whether this badge is wave-focused or weather-focused
  const isWaveBadge = relevantParams && relevantParams.every(p => WAVE_PARAMS.includes(p));

  // Model count — use the appropriate model type (wave vs weather)
  const modelCounts = daylightScores.map(s =>
    isWaveBadge ? s.waveModelsAvailable.length : s.modelsAvailable.length
  );
  const minModelCount = Math.min(...modelCounts);
  const maxModelCount = Math.max(...modelCounts);
  const modelCount = minModelCount;
  const modelNames = isWaveBadge
    ? worstScore.waveModelsAvailable.map(id => WAVE_MODEL_LABELS[id]).join(', ')
    : worstScore.modelsAvailable.map(id => MODEL_LABELS[id]).join(', ');
  // Show range if model availability varies across the day
  const modelCountLabel = minModelCount === maxModelCount
    ? `${modelCount} Weather Model${modelCount !== 1 ? 's' : ''}`
    : `${minModelCount}–${maxModelCount} Weather Models`;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      {/* Confidence indicator + Compare CTA */}
      <button
        ref={badgeRef}
        onClick={() => {
          if (onCompareModels) {
            onCompareModels();
          } else {
            setShowPopover(!showPopover);
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(88, 166, 255, 0.5)',
          backgroundColor: 'rgba(88, 166, 255, 0.15)',
          color: '#e6edf3',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          lineHeight: '1.4',
          transition: 'all 150ms',
          boxShadow: '0 0 12px rgba(88, 166, 255, 0.1)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(88, 166, 255, 0.28)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(88, 166, 255, 0.8)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(88, 166, 255, 0.2)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(88, 166, 255, 0.15)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(88, 166, 255, 0.5)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(88, 166, 255, 0.1)';
        }}
        title={`${modelCountLabel}: ${modelNames}`}
      >
        {/* Confidence dot */}
        <span style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: LEVEL_COLORS[worstScore.level],
          flexShrink: 0,
          boxShadow: `0 0 6px ${LEVEL_COLORS[worstScore.level]}`,
        }} />
        <span>Compare {modelCountLabel}</span>
        <span style={{ color: '#58a6ff', fontSize: '1rem', fontWeight: 700 }}>&rsaquo;</span>
      </button>

      {/* Popover (only used when no onCompareModels handler) */}
      {showPopover && !onCompareModels && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '0',
            zIndex: 1000,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            minWidth: '280px',
            maxWidth: '360px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            fontSize: '0.8rem',
          }}
        >
          {/* Popover header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <span style={{ fontWeight: 600, color: '#e6edf3' }}>
              Model Agreement
            </span>
            <span style={{
              color: LEVEL_COLORS[worstScore.level],
              fontWeight: 600,
              fontSize: '0.75rem',
            }}>
              {worstScore.overall}% — {LEVEL_LABELS[worstScore.level]}
            </span>
          </div>

          {/* Hourly confidence timeline */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{
              fontSize: '0.65rem',
              color: '#8b949e',
              marginBottom: '4px',
            }}>
              Hourly confidence (6AM–8PM)
            </div>
            <div style={{ display: 'flex', gap: '1px' }}>
              {timelineScores.map(s => {
                // Recompute filtered level for timeline bar too
                const filtered = relevantParams
                  ? s.breakdown.filter(b => relevantParams.includes(b.parameter))
                  : s.breakdown;
                let tw = 0, ws = 0;
                for (const b of filtered) {
                  if (b.modelsCompared >= 2) { tw += b.weight; ws += b.agrees ? b.weight : 0; }
                }
                const ov = tw > 0 ? Math.round((ws / tw) * 100) : 0;
                const lv: ConfidenceLevel = ov >= 80 ? 'high' : ov >= 50 ? 'moderate' : 'low';

                const hour = new Date(s.timestamp).getHours();
                return (
                  <div
                    key={s.timestamp}
                    style={{
                      flex: 1,
                      height: '12px',
                      backgroundColor: LEVEL_COLORS[lv],
                      opacity: s.timestamp === worstScore.timestamp ? 1 : 0.5,
                      borderRadius: '2px',
                      cursor: 'default',
                    }}
                    title={`${formatHour(hour)}: ${ov}% ${LEVEL_LABELS[lv]} (${isWaveBadge ? s.waveModelsAvailable.length : s.modelsAvailable.length} model${(isWaveBadge ? s.waveModelsAvailable.length : s.modelsAvailable.length) !== 1 ? 's' : ''})`}
                  />
                );
              })}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.6rem',
              color: '#8b949e',
              marginTop: '2px',
            }}>
              <span>6AM</span>
              <span>12PM</span>
              <span>8PM</span>
            </div>
          </div>

          {/* Parameter breakdown from worst hour */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              fontSize: '0.65rem',
              color: '#8b949e',
              marginBottom: '6px',
            }}>
              Worst window: {formatHour(new Date(worstScore.timestamp).getHours())}
            </div>
            {worstScore.breakdown
              .filter(b => b.modelsCompared >= 2)
              .map(b => (
                <div
                  key={b.parameter}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginBottom: '4px',
                    lineHeight: '1.4',
                  }}
                >
                  <span style={{
                    color: b.agrees ? '#2ea043' : '#f85149',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}>
                    {b.agrees ? '\u2713' : '\u2717'}
                  </span>
                  <span style={{ color: '#e6edf3' }}>
                    {describeAgreement(b)}
                  </span>
                </div>
              ))}
            {worstScore.breakdown
              .filter(b => b.modelsCompared < 2)
              .map(b => (
                <div
                  key={b.parameter}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                    color: '#8b949e',
                    fontStyle: 'italic',
                  }}
                >
                  <span style={{ fontSize: '0.75rem' }}>—</span>
                  <span>{PARAM_LABELS[b.parameter]}: insufficient model data</span>
                </div>
              ))}
          </div>

          {/* Footer */}
          <div style={{
            fontSize: '0.65rem',
            color: '#8b949e',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '6px',
          }}>
            Based on {modelNames || 'available models'}
            {modelCount < (isWaveBadge ? 2 : 3) && (
              <div style={{ marginTop: '2px', fontStyle: 'italic' }}>
                Fewer models available{isWaveBadge ? ' for this location' : ' for this day'} — confidence may be less reliable
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12AM';
  if (hour === 12) return '12PM';
  return hour > 12 ? `${hour - 12}PM` : `${hour}AM`;
}

function describeAgreement(b: ParameterAgreement): string {
  const label = PARAM_LABELS[b.parameter];
  const unit = PARAM_UNITS[b.parameter];

  if (b.parameter === 'precipitation') {
    if (b.agrees) {
      return `${label}: models agree on forecast`;
    }
    return `${label}: models disagree (spread ${b.spread.toFixed(0)}${unit})`;
  }

  if (b.agrees) {
    return `${label}: models agree (spread ${b.spread.toFixed(1)}${unit}, within ${b.threshold}${unit} threshold)`;
  }
  return `${label}: models disagree (spread ${b.spread.toFixed(1)}${unit}, exceeds ${b.threshold}${unit} threshold)`;
}
