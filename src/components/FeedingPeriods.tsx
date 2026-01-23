import { SolunarData, SolunarPeriod } from '../utils/solunarData';

interface FeedingPeriodsProps {
  data: SolunarData;
}

function FeedingPeriods({ data }: FeedingPeriodsProps) {
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
          🌓 FEEDING PERIODS
        </h2>
      </div>

      {/* Periods List */}
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
  );
}

export default FeedingPeriods;
