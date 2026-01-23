import { SolunarData } from '../utils/solunarData';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

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

  // Generate hourly activity data for the line chart
  const generateActivityData = () => {
    const chartData = [];
    const startOfDay = new Date(data.sunrise);
    startOfDay.setHours(0, 0, 0, 0);

    // Generate data points for every hour
    for (let hour = 0; hour < 24; hour++) {
      const time = new Date(startOfDay);
      time.setHours(hour);

      // Calculate activity level for this hour (0-100)
      let activity = 0;

      // Check if this hour overlaps with any major period
      for (const period of data.majorPeriods) {
        if (time >= period.start && time <= period.end) {
          activity = 100; // Peak activity during major periods
          break;
        }
        // Ramp up/down near major periods
        const hoursBefore = (period.start.getTime() - time.getTime()) / (1000 * 60 * 60);
        const hoursAfter = (time.getTime() - period.end.getTime()) / (1000 * 60 * 60);
        if (hoursBefore > 0 && hoursBefore <= 1) {
          activity = Math.max(activity, 50 + (1 - hoursBefore) * 50);
        } else if (hoursAfter > 0 && hoursAfter <= 1) {
          activity = Math.max(activity, 50 + (1 - hoursAfter) * 50);
        }
      }

      // Check if this hour overlaps with any minor period
      for (const period of data.minorPeriods) {
        if (time >= period.start && time <= period.end) {
          activity = Math.max(activity, 60); // Moderate activity during minor periods
        }
        // Ramp up/down near minor periods
        const hoursBefore = (period.start.getTime() - time.getTime()) / (1000 * 60 * 60);
        const hoursAfter = (time.getTime() - period.end.getTime()) / (1000 * 60 * 60);
        if (hoursBefore > 0 && hoursBefore <= 0.5) {
          activity = Math.max(activity, 30 + hoursBefore * 60);
        } else if (hoursAfter > 0 && hoursAfter <= 0.5) {
          activity = Math.max(activity, 30 + hoursAfter * 60);
        }
      }

      // Base activity level when no periods are active
      if (activity === 0) {
        activity = 10;
      }

      chartData.push({
        hour,
        timeLabel: time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        activity: Math.round(activity)
      });
    }

    return chartData;
  };

  const chartData = generateActivityData();

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          fontSize: '0.875rem'
        }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{data.timeLabel}</p>
          <p style={{ color: 'var(--color-solunar-major)' }}>
            Activity: {data.activity}%
          </p>
        </div>
      );
    }
    return null;
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

      {/* Activity Chart */}
      <div style={{ marginBottom: '1.5rem' }}>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-solunar-major)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-solunar-major)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="timeLabel"
              stroke="var(--color-text-secondary)"
              style={{ fontSize: '0.75rem' }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="var(--color-text-secondary)"
              style={{ fontSize: '0.75rem' }}
              label={{ value: 'Activity %', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-text-secondary)' } }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="activity"
              stroke="var(--color-solunar-major)"
              strokeWidth={2}
              fill="url(#activityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Period labels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.5rem',
            fontSize: '0.75rem',
            marginTop: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--color-border)'
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
