import { WeatherData } from '../types';
import { SolunarData } from '../utils/solunarData';

interface SunMoonTimesProps {
  data: SolunarData;
  weatherData: WeatherData[];
  selectedDay: Date;
}

function SunMoonTimes({ data, weatherData, selectedDay }: SunMoonTimesProps) {
  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getWeatherIcon = (cloudCover: number): string => {
    if (cloudCover >= 75) return '☁️'; // Cloudy
    if (cloudCover >= 50) return '⛅'; // Partly cloudy
    if (cloudCover >= 25) return '🌤️'; // Mostly sunny
    return '☀️'; // Sunny
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
           SUN & MOON
        </h2>
      </div>

      {/* Sun and Moon Info */}
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
    </div>
  );
}

export default SunMoonTimes;
