import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WaveData } from '../types';

interface WaveChartProps {
  data: WaveData[];
  selectedDay: Date;
}

function WaveChart({ data, selectedDay }: WaveChartProps) {
  // Filter data for selected day
  const startOfDay = new Date(selectedDay);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDay);
  endOfDay.setHours(23, 59, 59, 999);

  const dayData = data.filter(item => {
    const timestamp = new Date(item.timestamp);
    return timestamp >= startOfDay && timestamp <= endOfDay;
  });

  // Format data for chart
  const chartData = dayData.map(item => {
    const time = new Date(item.timestamp);
    return {
      time: time.getHours() + time.getMinutes() / 60,
      timeLabel: time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      height: Math.round(item.height * 10) / 10,
      windWaveHeight: Math.round(item.windWaveHeight * 10) / 10,
      direction: item.direction,
      directionCardinal: item.directionCardinal,
      period: Math.round(item.period * 10) / 10,
      fullTimestamp: item.timestamp
    };
  });

  // Check if current time is within selected day
  const now = new Date();
  const isToday = now >= startOfDay && now <= endOfDay;
  const currentHour = isToday ? now.getHours() + now.getMinutes() / 60 : null;

  // Get current wave conditions: use current hour's data if today, otherwise average for the day
  const getCurrentWave = () => {
    if (dayData.length === 0) return null;

    if (isToday) {
      // Find the data point closest to current time
      const currentHourFloor = now.getHours();
      const closest = dayData.reduce((prev, curr) => {
        const prevTime = new Date(prev.timestamp).getHours();
        const currTime = new Date(curr.timestamp).getHours();
        return Math.abs(currTime - currentHourFloor) < Math.abs(prevTime - currentHourFloor) ? curr : prev;
      });
      return closest;
    } else {
      // Return average wave data for other days
      const avgHeight = Math.round(dayData.reduce((sum, item) => sum + item.height, 0) / dayData.length * 10) / 10;
      const avgWindWaveHeight = Math.round(dayData.reduce((sum, item) => sum + item.windWaveHeight, 0) / dayData.length * 10) / 10;
      const avgPeriod = Math.round(dayData.reduce((sum, item) => sum + item.period, 0) / dayData.length * 10) / 10;
      // Use most common direction (mode) for average
      const directions = dayData.map(d => d.directionCardinal);
      const modeDirection = directions.sort((a, b) =>
        directions.filter(v => v === a).length - directions.filter(v => v === b).length
      ).pop() || '';
      const avgDirectionDegrees = Math.round(dayData.reduce((sum, item) => sum + item.direction, 0) / dayData.length);
      return {
        height: avgHeight,
        windWaveHeight: avgWindWaveHeight,
        direction: avgDirectionDegrees,
        directionCardinal: modeDirection,
        period: avgPeriod,
        isAverage: true
      };
    }
  };

  const currentWave = getCurrentWave();

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
          <p style={{ color: 'var(--color-wave)' }}>
            Wave Height: {data.height} ft {data.directionCardinal}
          </p>
          <p style={{ color: 'var(--color-wave-secondary)' }}>
            Wind Wave: {data.windWaveHeight} ft
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Period: {data.period}s &middot; Direction: {data.direction}°
          </p>
        </div>
      );
    }
    return null;
  };

  // Wave direction arrow component for header
  const WaveArrow = ({ direction }: { direction: number }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ transform: `rotate(${direction + 180}deg)` }}>
      <path
        d="M12 2 L16 10 L12 8 L8 10 Z"
        fill="var(--color-wave)"
        stroke="var(--color-wave)"
        strokeWidth="1"
      />
      <line x1="12" y1="8" x2="12" y2="20" stroke="var(--color-wave)" strokeWidth="2" />
    </svg>
  );

  // Custom dot with wave direction arrow for chart points
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload || payload.direction === undefined) return null;

    return (
      <g transform={`translate(${cx}, ${cy})`}>
        <g transform={`rotate(${payload.direction + 180})`}>
          <path
            d="M0,-8 L3,0 L0,-2 L-3,0 Z"
            fill="var(--color-wave)"
            stroke="white"
            strokeWidth="0.5"
          />
          <line x1="0" y1="-2" x2="0" y2="6" stroke="var(--color-wave)" strokeWidth="1.5" />
        </g>
      </g>
    );
  };

  if (chartData.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-text-secondary)'
      }}>
        No wave data available for this day
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
        alignItems: 'center',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          margin: 0,
          color: 'var(--color-wave)'
        }}>
          WAVE CONDITIONS
        </h2>
        {currentWave && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-wave)' }}>
                {Math.round(currentWave.height * 10) / 10} ft
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                {'isAverage' in currentWave ? 'Avg Height' : 'Current Height'}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Period: {Math.round(currentWave.period * 10) / 10}s
              </div>
            </div>
            <WaveArrow direction={currentWave.direction} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {currentWave.directionCardinal}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={140} className="wave-chart">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          />
          <YAxis
            stroke="var(--color-text-secondary)"
            style={{ fontSize: '0.75rem' }}
            label={{ value: 'ft', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-text-secondary)' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          {currentHour !== null && (
            <ReferenceLine
              x={currentHour}
              stroke="#FCD34D"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{ value: 'Now', position: 'top', fill: '#FCD34D', fontSize: 12 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="height"
            stroke="var(--color-wave)"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 8 }}
            name="Wave Height"
          />
          <Line
            type="monotone"
            dataKey="windWaveHeight"
            stroke="var(--color-wave-secondary)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            name="Wind Wave Height"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        marginTop: '0.5rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--color-border)',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="30" height="3" viewBox="0 0 30 3">
            <line x1="0" y1="1.5" x2="30" y2="1.5" stroke="var(--color-wave)" strokeWidth="2" />
          </svg>
          <span style={{ color: 'var(--color-text-secondary)' }}>Wave Height</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="30" height="3" viewBox="0 0 30 3">
            <line x1="0" y1="1.5" x2="30" y2="1.5" stroke="var(--color-wave-secondary)" strokeWidth="2" strokeDasharray="5 5" />
          </svg>
          <span style={{ color: 'var(--color-text-secondary)' }}>Wind Wave Height</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <g transform="translate(8, 8) rotate(0)">
              <path
                d="M0,-6 L2,0 L0,-1.5 L-2,0 Z"
                fill="var(--color-wave)"
                stroke="white"
                strokeWidth="0.5"
              />
              <line x1="0" y1="-1.5" x2="0" y2="4" stroke="var(--color-wave)" strokeWidth="1.5" />
            </g>
          </svg>
          <span style={{ color: 'var(--color-text-secondary)' }}>Wave Direction</span>
        </div>
      </div>
    </div>
  );
}

export default WaveChart;
