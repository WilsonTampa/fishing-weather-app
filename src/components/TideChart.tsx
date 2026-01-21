import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { TideData } from '../types';

interface TideChartProps {
  data: TideData[];
  selectedDay: Date;
  stationName?: string;
}

function TideChart({ data, selectedDay, stationName }: TideChartProps) {
  // Filter data for selected day and surrounding times for smooth curve
  const startOfDay = new Date(selectedDay);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDay);
  endOfDay.setHours(23, 59, 59, 999);

  const dayData = data.filter(item => {
    const timestamp = new Date(item.timestamp);
    return timestamp >= startOfDay && timestamp <= endOfDay;
  });

  // Get next high/low tide
  const now = new Date();
  const upcomingTide = data.find(item => new Date(item.timestamp) > now);

  // Format data for chart - create smooth curve between high/low points
  const chartData: any[] = [];

  if (dayData.length > 0) {
    // Get tides from previous and next day for interpolation at day boundaries
    const prevDayEnd = new Date(startOfDay);
    prevDayEnd.setHours(-1);
    const nextDayStart = new Date(endOfDay);
    nextDayStart.setHours(24);

    const prevTide = data.filter(item => new Date(item.timestamp) < startOfDay).pop();
    const nextTide = data.find(item => new Date(item.timestamp) > endOfDay);

    // Add interpolated point at midnight (start of day)
    if (prevTide && dayData[0]) {
      const prevTime = new Date(prevTide.timestamp);
      const firstTime = new Date(dayData[0].timestamp);
      const timeDiff = firstTime.getTime() - prevTime.getTime();
      const heightDiff = dayData[0].height - prevTide.height;
      const timeToMidnight = startOfDay.getTime() - prevTime.getTime();
      const fraction = timeToMidnight / timeDiff;
      const midnightHeight = prevTide.height + heightDiff * fraction;

      chartData.push({
        time: 0,
        timeLabel: '12:00AM',
        height: parseFloat(midnightHeight.toFixed(2)),
        type: null,
        fullTimestamp: startOfDay.toISOString(),
        isActual: false
      });
    }

    // Add all tide events for the day
    for (let i = 0; i < dayData.length; i++) {
      const current = dayData[i];
      const time = new Date(current.timestamp);

      // Add the actual tide point
      chartData.push({
        time: time.getHours() + time.getMinutes() / 60,
        timeLabel: time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        height: parseFloat(current.height.toFixed(2)),
        type: current.type,
        fullTimestamp: current.timestamp,
        isActual: true
      });

      // If there's a next point, add interpolated points for smooth curve
      if (i < dayData.length - 1) {
        const next = dayData[i + 1];
        const nextTime = new Date(next.timestamp);
        const timeDiff = nextTime.getTime() - time.getTime();
        const heightDiff = next.height - current.height;

        // Add 5 interpolated points between actual tide events
        for (let j = 1; j <= 5; j++) {
          const fraction = j / 6;
          const interpTime = new Date(time.getTime() + timeDiff * fraction);
          const interpHeight = current.height + heightDiff * fraction;

          chartData.push({
            time: interpTime.getHours() + interpTime.getMinutes() / 60,
            timeLabel: interpTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            height: parseFloat(interpHeight.toFixed(2)),
            type: null,
            fullTimestamp: interpTime.toISOString(),
            isActual: false
          });
        }
      }
    }

    // Add interpolated point at end of day (11:59 PM)
    if (nextTide && dayData[dayData.length - 1]) {
      const lastTime = new Date(dayData[dayData.length - 1].timestamp);
      const nextTime = new Date(nextTide.timestamp);
      const timeDiff = nextTime.getTime() - lastTime.getTime();
      const heightDiff = nextTide.height - dayData[dayData.length - 1].height;
      const timeFromLast = endOfDay.getTime() - lastTime.getTime();
      const fraction = timeFromLast / timeDiff;
      const endHeight = dayData[dayData.length - 1].height + heightDiff * fraction;

      chartData.push({
        time: 23.99,
        timeLabel: '11:59PM',
        height: parseFloat(endHeight.toFixed(2)),
        type: null,
        fullTimestamp: endOfDay.toISOString(),
        isActual: false
      });
    }
  }

  // Sort by time
  chartData.sort((a, b) => a.time - b.time);

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
          <p style={{ color: 'var(--color-tide)' }}>
            Height: {data.height} ft
          </p>
          {data.type && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              {data.type === 'H' ? 'High Tide' : 'Low Tide'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (dayData.length === 0) {
    return (
      <div style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.75rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            margin: 0,
            color: 'var(--color-tide)'
          }}>
            🌊 TIDES
          </h2>
        </div>
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--color-text-secondary)'
        }}>
          No tide data available for this location
          {stationName && (
            <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
              Nearest station: {stationName}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '0.75rem'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          margin: 0,
          color: 'var(--color-tide)'
        }}>
          🌊 TIDES
        </h2>
        {upcomingTide && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Next: {upcomingTide.type === 'H' ? 'High' : 'Low'} Tide
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-tide)' }}>
              {new Date(upcomingTide.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {upcomingTide.height.toFixed(2)} ft
            </div>
          </div>
        )}
      </div>

      {stationName && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '1rem'
        }}>
          📍 {stationName}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200} className="tide-chart">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-tide)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--color-tide)" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="time"
            stroke="var(--color-text-secondary)"
            style={{ fontSize: '0.75rem' }}
            tickFormatter={(value) => {
              const hour = Math.floor(value);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
              return `${displayHour}${ampm}`;
            }}
            type="number"
            domain={[0, 24]}
            ticks={[0, 6, 12, 18, 24]}
            allowDataOverflow={false}
          />
          <YAxis
            stroke="var(--color-text-secondary)"
            style={{ fontSize: '0.75rem' }}
            label={{ value: 'feet', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-text-secondary)' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="natural"
            dataKey="height"
            stroke="var(--color-tide)"
            strokeWidth={2}
            fill="url(#tideGradient)"
          />
          {/* Mark high and low tide points */}
          {dayData.map((tide, index) => {
            const time = new Date(tide.timestamp);
            const xValue = time.getHours() + time.getMinutes() / 60;
            return (
              <ReferenceDot
                key={index}
                x={xValue}
                y={tide.height}
                r={6}
                fill={tide.type === 'H' ? '#4ADE80' : '#F87171'}
                stroke="white"
                strokeWidth={2}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TideChart;
