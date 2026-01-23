import { SolunarData } from '../utils/solunarData';

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
          MAJOR/MINOR TIMES
        </h2>
      </div>

      {/* Two Column Layout */}
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
              backgroundColor: 'var(--color-solunar-major)',
              color: 'white',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
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
              .sort((a, b) => a.start.getTime() - b.start.getTime())
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
              backgroundColor: 'var(--color-solunar-minor)',
              color: '#1a1a1a',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
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
              .sort((a, b) => a.start.getTime() - b.start.getTime())
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

export default FeedingPeriods;
