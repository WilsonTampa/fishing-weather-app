import { WeatherData } from '../types';
import { SolunarData } from '../utils/solunarData';

interface SunMoonFeedingProps {
  data: SolunarData;
  weatherData: WeatherData[];
  selectedDay: Date;
}

function SunMoonFeeding({ data, weatherData, selectedDay }: SunMoonFeedingProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getWeatherIcon = (cloudCover: number): string => {
    if (cloudCover >= 75) return '☁️';
    if (cloudCover >= 50) return '⛅';
    if (cloudCover >= 25) return '🌤️';
    return '☀️';
  };

  const sortByTimeOfDay = (a: { start: Date }, b: { start: Date }) => {
    const aMinutes = a.start.getHours() * 60 + a.start.getMinutes();
    const bMinutes = b.start.getHours() * 60 + b.start.getMinutes();
    return aMinutes - bMinutes;
  };

  const startOfDay = new Date(selectedDay);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDay);
  endOfDay.setHours(23, 59, 59, 999);

  const dayWeatherData = weatherData.filter(item => {
    const timestamp = new Date(item.timestamp);
    return timestamp >= startOfDay && timestamp <= endOfDay;
  });

  const currentCloudCover = dayWeatherData[0]?.cloudCover ?? 0;
  const sunIcon = getWeatherIcon(currentCloudCover);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem'
      }}
    >
      {/* ── Sun & Moon Section ── */}
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
          SUN & MOON
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: '0.75rem',
              alignItems: 'start'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Sunrise</span>
                <span style={{ fontWeight: 600 }}>{formatTime(data.sunrise)}</span>
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
            <div
              aria-label={`Cloud cover: ${currentCloudCover}%`}
              role="img"
              title={`Cloud cover: ${currentCloudCover}%`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                alignSelf: 'start'
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  lineHeight: 1
                }}
              >
                {sunIcon}
              </div>
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
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: '0.75rem',
              alignItems: 'start'
            }}
          >
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
                <span style={{ color: 'var(--color-text-secondary)' }}>Illumination</span>
                <span style={{ fontWeight: 600 }}>{data.moonIllumination}%</span>
              </div>
            </div>
            <div
              aria-label={`Moon phase: ${data.moonPhase}`}
              role="img"
              title={data.moonPhase}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                alignSelf: 'start'
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  lineHeight: 1
                }}
              >
                {data.moonPhaseEmoji}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          margin: '1.25rem 0 1rem 0'
        }}
      />

      {/* ── Feeding Times Section ── */}
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
          MAJOR & MINOR FEEDING TIMES
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem'
        }}
      >
        {/* Major Periods Column */}
        <div>
          <div
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-solunar-major)',
              borderBottom: '2px solid var(--color-solunar-major)',
              padding: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '0.5rem'
            }}
          >
            MAJOR PERIODS
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            {[...data.majorPeriods]
              .sort(sortByTimeOfDay)
              .map((period, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'var(--color-background)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {formatTime(period.start)} - {formatTime(period.end)}
                </div>
              ))}
          </div>
        </div>

        {/* Minor Periods Column */}
        <div>
          <div
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-solunar-minor)',
              borderBottom: '2px solid var(--color-solunar-minor)',
              padding: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '0.5rem'
            }}
          >
            MINOR PERIODS
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            {[...data.minorPeriods]
              .sort(sortByTimeOfDay)
              .map((period, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'var(--color-background)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-solunar-minor)'
                  }}
                >
                  {formatTime(period.start)} - {formatTime(period.end)}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SunMoonFeeding;
