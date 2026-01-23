import { SolunarData, SolunarPeriod } from '../utils/solunarData';

interface SolunarChartProps {
  data: SolunarData;
  selectedDay: Date;
}

function SolunarChart({ data }: SolunarChartProps) {
  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Combine and sort all periods chronologically
  const getAllPeriods = () => {
    const periods: Array<{ type: 'MAJOR' | 'MINOR'; period: SolunarPeriod }> = [];

    data.majorPeriods.forEach(period => {
      periods.push({ type: 'MAJOR', period });
    });

    data.minorPeriods.forEach(period => {
      periods.push({ type: 'MINOR', period });
    });

    // Sort by start time
    periods.sort((a, b) => a.period.start.getTime() - b.period.start.getTime());

    return periods;
  };

  const allPeriods = getAllPeriods();

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            margin: 0,
            color: 'var(--color-solunar-major)'
          }}
        >
          🌓 SOLUNAR FISHING FORECAST
        </h2>
      </div>

      {/* Feeding Periods */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3
          style={{
            fontSize: '1rem',
            margin: '0 0 0.75rem 0',
            color: 'var(--color-text-primary)',
            fontWeight: 600
          }}
        >
          Best Feeding Times
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          {allPeriods.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: item.type === 'MAJOR' ? 'var(--color-solunar-major)' : 'var(--color-solunar-minor)',
                  fontSize: '0.875rem'
                }}
              >
                {item.type}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {formatTime(item.period.start)} - {formatTime(item.period.end)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sun and Moon Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Sun Card */}
        <div
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            border: '1px solid var(--color-border)'
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              margin: '0 0 0.75rem 0',
              color: 'var(--color-sun)',
              fontWeight: 600
            }}
          >
            ☀️ SUN
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Sunrise</span>
              <span style={{ fontWeight: 600 }}>{formatTime(data.sunrise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Solar Noon</span>
              <span style={{ fontWeight: 600 }}>{formatTime(data.solarNoon)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Sunset</span>
              <span style={{ fontWeight: 600 }}>{formatTime(data.sunset)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Day Length</span>
              <span style={{ fontWeight: 600 }}>{data.dayLength}</span>
            </div>
          </div>
        </div>

        {/* Moon Card */}
        <div
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            border: '1px solid var(--color-border)'
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              margin: '0 0 0.75rem 0',
              color: 'var(--color-moon)',
              fontWeight: 600
            }}
          >
            🌙 MOON
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Moonrise</span>
              <span style={{ fontWeight: 600 }}>
                {data.moonrise ? formatTime(data.moonrise) : 'No rise'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Moonset</span>
              <span style={{ fontWeight: 600 }}>
                {data.moonset ? formatTime(data.moonset) : 'No set'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Phase</span>
              <span style={{ fontWeight: 600 }}>{data.moonPhase}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Illumination</span>
              <span style={{ fontWeight: 600 }}>{data.moonIllumination}%</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default SolunarChart;
