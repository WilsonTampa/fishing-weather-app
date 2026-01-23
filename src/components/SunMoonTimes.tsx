import { SolunarData } from '../utils/solunarData';

interface SunMoonTimesProps {
  data: SolunarData;
}

function SunMoonTimes({ data }: SunMoonTimesProps) {
  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

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
            color: 'var(--color-sun)'
          }}
        >
          ☀️🌙 SUN & MOON TIMES
        </h2>
      </div>

      {/* Sun and Moon Info */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Sun Section */}
        <div>
          <h3
            style={{
              fontSize: '0.875rem',
              margin: '0 0 0.5rem 0',
              color: 'var(--color-sun)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            ☀️ Sun
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

        {/* Moon Section */}
        <div>
          <h3
            style={{
              fontSize: '0.875rem',
              margin: '0 0 0.5rem 0',
              color: 'var(--color-moon)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            🌙 Moon
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

export default SunMoonTimes;
