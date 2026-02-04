import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine } from 'recharts';
import { TideData } from '../types';

interface TideChartProps {
  data: TideData[];
  selectedDay: Date;
  stationName?: string;
  waterTemperature?: number | null;
}

function TideChart({ data, selectedDay, stationName, waterTemperature }: TideChartProps) {
  // Filter data for selected day and surrounding times for smooth curve
  const startOfDay = new Date(selectedDay);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDay);
  endOfDay.setHours(23, 59, 59, 999);

  const dayData = data.filter(item => {
    const timestamp = new Date(item.timestamp);
    return timestamp >= startOfDay && timestamp <= endOfDay;
  });

  // Calculate tidal range for the day
  const highs = dayData.filter(t => t.type === 'H').map(t => t.height);
  const lows = dayData.filter(t => t.type === 'L').map(t => t.height);
  const tidalRange = highs.length && lows.length
    ? Math.max(...highs) - Math.min(...lows)
    : null;
  const rangeLabel = tidalRange !== null
    ? tidalRange >= 4 ? 'Strong' : tidalRange >= 2 ? 'Moderate' : 'Weak'
    : null;

  const now = new Date();

  // Check if current time is within selected day
  const isToday = now >= startOfDay && now <= endOfDay;
  const currentTime = isToday ? now.getHours() + now.getMinutes() / 60 : null;

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
      const cosFraction = (1 - Math.cos(fraction * Math.PI)) / 2;
      const midnightHeight = prevTide.height + heightDiff * cosFraction;

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

        // Add interpolated points between actual tide events using cosine interpolation
        const numPoints = 30;
        for (let j = 1; j <= numPoints; j++) {
          const fraction = j / (numPoints + 1);
          const interpTime = new Date(time.getTime() + timeDiff * fraction);
          // Cosine interpolation for smooth, natural tide curve
          const cosFraction = (1 - Math.cos(fraction * Math.PI)) / 2;
          const interpHeight = current.height + heightDiff * cosFraction;

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
      const cosFraction = (1 - Math.cos(fraction * Math.PI)) / 2;
      const endHeight = dayData[dayData.length - 1].height + heightDiff * cosFraction;

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
            TIDE PREDICTIONS
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
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          margin: 0,
          color: 'var(--color-tide)'
        }}>
          TIDE PREDICTIONS
        </h2>
        {dayData.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {/* Low Tides */}
            {dayData.some(t => t.type === 'L') && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                  Low tide
                </div>
                {dayData.filter(t => t.type === 'L').map((tide, index) => {
                  const tideTime = new Date(tide.timestamp);
                  return (
                    <div key={index} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
                        {tideTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {tide.height.toFixed(2)} ft
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {/* High Tides */}
            {dayData.some(t => t.type === 'H') && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                  High tide
                </div>
                {dayData.filter(t => t.type === 'H').map((tide, index) => {
                  const tideTime = new Date(tide.timestamp);
                  return (
                    <div key={index} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
                        {tideTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {tide.height.toFixed(2)} ft
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Tidal Range */}
            {tidalRange !== null && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                  Tidal range
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
                    {tidalRange.toFixed(2)} ft
                  </span>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: rangeLabel === 'Strong' ? '#4ADE80' : rangeLabel === 'Moderate' ? '#FCD34D' : 'var(--color-text-secondary)',
                  fontWeight: 600
                }}>
                  {rangeLabel}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {stationName && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>📍 {stationName}</span>
          {waterTemperature !== null && waterTemperature !== undefined && (
            <span style={{ fontWeight: 600 }}>
              Water Temp: {waterTemperature.toFixed(1)}°F
            </span>
          )}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={140} className="tide-chart">
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
          {currentTime !== null && (
            <ReferenceLine
              x={currentTime}
              stroke="#FCD34D"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{ value: 'Now', position: 'top', fill: '#FCD34D', fontSize: 12 }}
            />
          )}
          <Area
            type="monotone"
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
