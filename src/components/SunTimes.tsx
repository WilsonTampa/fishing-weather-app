import { SolunarData } from '../utils/solunarData';

interface SunTimesProps {
  data: SolunarData;
}

function SunTimes({ data }: SunTimesProps) {
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
          ☀️ SUN TIMES
        </h2>
      </div>

      {/* Sun Info */}
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
  );
}

export default SunTimes;
