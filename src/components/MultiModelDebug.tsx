/**
 * TEMPORARY DEBUG COMPONENT — Remove before Phase B/production
 * Displays multi-model data and confidence scores for testing Phase A pipeline
 */
import { useState } from 'react';
import type { MultiModelData, ConfidenceLevel, WeatherModelId, WaveModelId } from '../types/multiModel';

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

const MODEL_LABELS: Record<WeatherModelId, string> = {
  gfs: 'GFS (NOAA)',
  ecmwf: 'ECMWF',
  hrrr: 'HRRR',
  nam: 'NAM',
};

const WAVE_MODEL_LABELS: Record<WaveModelId, string> = {
  ecmwf_wam: 'ECMWF WAM',
  gfs_ww3: 'GFS WaveWatch III',
};

interface Props {
  data: MultiModelData | null | undefined;
  selectedDay: Date;
}

export default function MultiModelDebug({ data, selectedDay }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  if (!data) {
    return (
      <div style={cardStyle}>
        <h3 style={headerStyle}>Multi-Model Debug</h3>
        <p style={{ color: '#8b949e', fontSize: '0.85rem' }}>
          No multi-model data available. Check console for errors.
        </p>
      </div>
    );
  }

  // Filter confidence scores to selected day
  const dayStr = selectedDay.toISOString().split('T')[0];
  const dayScores = data.confidence.filter(s => s.timestamp.startsWith(dayStr));

  // Get the selected hour's detailed data, or the first hour
  const activeTimestamp = selectedHour || (dayScores.length > 0 ? dayScores[0].timestamp : null);
  const activeScore = dayScores.find(s => s.timestamp === activeTimestamp);
  const activeNormalized = data.normalized.find(n => n.timestamp === activeTimestamp);

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div
        style={{ ...headerStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span>Multi-Model Debug Panel</span>
        <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>
          {data.models.length} weather models, {data.waveModels.length} wave models | {expanded ? 'collapse' : 'expand'}
        </span>
      </div>

      {!expanded && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
          {dayScores.map(s => (
            <div
              key={s.timestamp}
              style={{
                width: '8px',
                height: '20px',
                backgroundColor: LEVEL_COLORS[s.level],
                borderRadius: '2px',
                opacity: 0.8,
              }}
              title={`${formatHour(s.timestamp)} — ${s.overall}% ${LEVEL_LABELS[s.level]}`}
            />
          ))}
        </div>
      )}

      {expanded && (
        <>
          {/* Model Status */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>Models Loaded</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {data.models.map(m => (
                <span key={m.modelId} style={tagStyle('#58a6ff')}>
                  {MODEL_LABELS[m.modelId]} — {m.wind.length}hrs
                </span>
              ))}
              {data.waveModels.map(m => (
                <span key={m.modelId} style={tagStyle('#a371f7')}>
                  {WAVE_MODEL_LABELS[m.modelId]} — {m.waves.length}hrs
                </span>
              ))}
            </div>
          </div>

          {/* Confidence Timeline */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>Confidence Timeline — {dayStr}</div>
            {dayScores.length === 0 ? (
              <p style={{ color: '#8b949e', fontSize: '0.8rem' }}>No data for selected day</p>
            ) : (
              <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                {dayScores.map(s => (
                  <div
                    key={s.timestamp}
                    onClick={() => setSelectedHour(s.timestamp)}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: activeTimestamp === s.timestamp ? LEVEL_COLORS[s.level] : `${LEVEL_COLORS[s.level]}33`,
                      color: activeTimestamp === s.timestamp ? '#fff' : LEVEL_COLORS[s.level],
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      fontWeight: activeTimestamp === s.timestamp ? 'bold' : 'normal',
                      border: `1px solid ${LEVEL_COLORS[s.level]}66`,
                      minWidth: '36px',
                      textAlign: 'center',
                    }}
                    title={`${s.overall}% — ${s.modelsAvailable.length} models`}
                  >
                    {formatHour(s.timestamp)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Hour Detail */}
          {activeScore && activeNormalized && (
            <>
              {/* Confidence Breakdown */}
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                  {formatHour(activeScore.timestamp)} — {activeScore.overall}%{' '}
                  <span style={{ color: LEVEL_COLORS[activeScore.level] }}>
                    {LEVEL_LABELS[activeScore.level]}
                  </span>
                  <span style={{ color: '#8b949e', fontWeight: 'normal', marginLeft: '8px' }}>
                    ({activeScore.modelsAvailable.length} models)
                  </span>
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Parameter</th>
                      <th style={thStyle}>Weight</th>
                      <th style={thStyle}>Spread</th>
                      <th style={thStyle}>Threshold</th>
                      <th style={thStyle}>Agrees?</th>
                      <th style={thStyle}>Models</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeScore.breakdown.map(b => (
                      <tr key={b.parameter}>
                        <td style={tdStyle}>{b.parameter}</td>
                        <td style={tdStyle}>{Math.round(b.weight * 100)}%</td>
                        <td style={tdStyle}>{b.spread.toFixed(1)}</td>
                        <td style={tdStyle}>{b.parameter === 'precipitation' ? 'consensus' : `<= ${b.threshold}`}</td>
                        <td style={{ ...tdStyle, color: b.agrees ? '#2ea043' : '#f85149' }}>
                          {b.agrees ? 'YES' : 'NO'}
                        </td>
                        <td style={tdStyle}>{b.modelsCompared}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Model Comparison Table */}
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Raw Model Values — {formatHour(activeScore.timestamp)}</div>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Model</th>
                      <th style={thStyle}>Wind (mph)</th>
                      <th style={thStyle}>Gusts (mph)</th>
                      <th style={thStyle}>Dir (°)</th>
                      <th style={thStyle}>Precip %</th>
                      <th style={thStyle}>Temp (°F)</th>
                      <th style={thStyle}>Pressure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(activeNormalized.models) as WeatherModelId[]).map(modelId => {
                      const m = activeNormalized.models[modelId];
                      if (!m) return null;
                      return (
                        <tr key={modelId}>
                          <td style={{ ...tdStyle, fontWeight: 'bold', color: '#58a6ff' }}>
                            {MODEL_LABELS[modelId]}
                          </td>
                          <td style={tdStyle}>{m.wind?.speed?.toFixed(1) ?? '—'}</td>
                          <td style={tdStyle}>{m.wind?.gusts?.toFixed(1) ?? '—'}</td>
                          <td style={tdStyle}>{m.wind?.direction?.toFixed(0) ?? '—'}°</td>
                          <td style={tdStyle}>{m.weather?.precipitationProbability?.toFixed(0) ?? '—'}%</td>
                          <td style={tdStyle}>{m.temperature?.temperature?.toFixed(1) ?? '—'}</td>
                          <td style={tdStyle}>{m.pressure?.pressure?.toFixed(2) ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Wave comparison */}
                {Object.keys(activeNormalized.waveModels).length > 0 && (
                  <table style={{ ...tableStyle, marginTop: '8px' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Wave Model</th>
                        <th style={thStyle}>Height (ft)</th>
                        <th style={thStyle}>Period (s)</th>
                        <th style={thStyle}>Direction (°)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.keys(activeNormalized.waveModels) as WaveModelId[]).map(modelId => {
                        const w = activeNormalized.waveModels[modelId];
                        if (!w) return null;
                        return (
                          <tr key={modelId}>
                            <td style={{ ...tdStyle, fontWeight: 'bold', color: '#a371f7' }}>
                              {WAVE_MODEL_LABELS[modelId]}
                            </td>
                            <td style={tdStyle}>{w.height?.toFixed(1) ?? '—'}</td>
                            <td style={tdStyle}>{w.period?.toFixed(1) ?? '—'}</td>
                            <td style={tdStyle}>{w.direction?.toFixed(0) ?? '—'}°</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Helpers ──

function formatHour(timestamp: string): string {
  const d = new Date(timestamp);
  const h = d.getHours();
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h > 12 ? `${h - 12}p` : `${h}a`;
}

// ── Inline styles (throwaway component, no CSS file needed) ──

const cardStyle: React.CSSProperties = {
  backgroundColor: '#161b22',
  border: '2px dashed #f0883e',
  borderRadius: '8px',
  padding: '12px',
  marginTop: '1rem',
};

const headerStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 'bold',
  color: '#f0883e',
  margin: 0,
};

const sectionStyle: React.CSSProperties = {
  marginTop: '12px',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 'bold',
  color: '#e6edf3',
  marginBottom: '6px',
};

const tagStyle = (color: string): React.CSSProperties => ({
  fontSize: '0.75rem',
  padding: '2px 8px',
  borderRadius: '12px',
  backgroundColor: `${color}22`,
  color,
  border: `1px solid ${color}44`,
});

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.75rem',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '4px 6px',
  borderBottom: '1px solid #30363d',
  color: '#8b949e',
  fontWeight: 'normal',
};

const tdStyle: React.CSSProperties = {
  padding: '4px 6px',
  borderBottom: '1px solid #21262d',
  color: '#e6edf3',
};
