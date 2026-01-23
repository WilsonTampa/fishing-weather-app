import { SolunarData } from '../utils/solunarData';

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

  // Get activity label and color based on score
  const getActivityInfo = (score: number) => {
    if (score >= 86) return { label: 'EXCELLENT', color: 'var(--color-activity-excellent)' };
    if (score >= 61) return { label: 'GOOD', color: 'var(--color-activity-good)' };
    if (score >= 31) return { label: 'FAIR', color: 'var(--color-activity-fair)' };
    return { label: 'POOR', color: 'var(--color-activity-poor)' };
  };

  const activityInfo = getActivityInfo(data.activityScore);

  // Convert period times to position on 24-hour timeline (0-100%)
  const getTimelinePosition = (date: Date) => {
    const hours = date.getHours() + date.getMinutes() / 60;
    return (hours / 24) * 100;
  };

  // Render a period bar on the timeline
  const renderPeriod = (start: Date, end: Date, isMajor: boolean) => {
    const startPos = getTimelinePosition(start);
    const endPos = getTimelinePosition(end);
    const width = endPos - startPos;

    return (
      <div
        key={`${start.getTime()}-${isMajor ? 'major' : 'minor'}`}
        style={{
          position: 'absolute',
          left: `${startPos}%`,
          width: `${width}%`,
          height: isMajor ? '24px' : '16px',
          backgroundColor: isMajor ? 'var(--color-solunar-major)' : 'var(--color-solunar-minor)',
          borderRadius: '4px',
          top: isMajor ? '0' : '4px'
        }}
      />
    );
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
            color: 'var(--color-solunar-major)'
          }}
        >
          🌓 SOLUNAR FISHING FORECAST
        </h2>
      </div>

      {/* Timeline Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Hour markers */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.5rem'
          }}
        >
          <span>12AM</span>
          <span>6AM</span>
          <span>12PM</span>
          <span>6PM</span>
          <span>12AM</span>
        </div>

        {/* Timeline bar with periods */}
        <div
          style={{
            position: 'relative',
            height: '32px',
            backgroundColor: 'var(--color-background)',
            borderRadius: '4px',
            border: '1px solid var(--color-solunar-timeline)',
            marginBottom: '1rem'
          }}
        >
          {/* Render major periods */}
          {data.majorPeriods.map((period) => renderPeriod(period.start, period.end, true))}

          {/* Render minor periods */}
          {data.minorPeriods.map((period) => renderPeriod(period.start, period.end, false))}
        </div>

        {/* Period labels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.5rem',
            fontSize: '0.75rem'
          }}
        >
          {data.majorPeriods.map((period, idx) => (
            <div
              key={`major-label-${idx}`}
              style={{
                color: 'var(--color-solunar-major)',
                fontWeight: 600
              }}
            >
              MAJOR: {formatTime(period.start)} - {formatTime(period.end)}
            </div>
          ))}
          {data.minorPeriods.map((period, idx) => (
            <div
              key={`minor-label-${idx}`}
              style={{
                color: 'var(--color-solunar-minor)',
                fontWeight: 600
              }}
            >
              MINOR: {formatTime(period.start)} - {formatTime(period.end)}
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

      {/* Activity Score Bar */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '1rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>FISHING ACTIVITY:</span>
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: activityInfo.color
            }}
          >
            {data.activityScore}% - {activityInfo.label}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '24px',
            backgroundColor: 'var(--color-background)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--color-border)'
          }}
        >
          <div
            style={{
              width: `${data.activityScore}%`,
              height: '100%',
              backgroundColor: activityInfo.color,
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default SolunarChart;
