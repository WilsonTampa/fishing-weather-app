import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WindData } from '../types';
import type { MultiModelData } from '../types/multiModel';
import ConfidenceBadge from './ConfidenceBadge';

interface WindChartProps {
  data: WindData[];
  selectedDay: Date;
  multiModelData?: MultiModelData | null;
  onCompareModels?: () => void;
}

function WindChart({ data, selectedDay, multiModelData, onCompareModels }: WindChartProps) {
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
      speed: Math.round(item.speed),
      gusts: Math.round(item.gusts),
      direction: item.direction,
      directionCardinal: item.directionCardinal,
      fullTimestamp: item.timestamp
    };
  });

  // Check if current time is within selected day
  const now = new Date();
  const isToday = now >= startOfDay && now <= endOfDay;
  const currentHour = isToday ? now.getHours() + now.getMinutes() / 60 : null;

  // Get current wind conditions: use current hour's data if today, otherwise average for the day
  const getCurrentWind = () => {
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
      // Return average wind data for other days
      const avgSpeed = Math.round(dayData.reduce((sum, item) => sum + item.speed, 0) / dayData.length);
      const avgGusts = Math.round(dayData.reduce((sum, item) => sum + item.gusts, 0) / dayData.length);
      // Use most common direction (mode) for average
      const directions = dayData.map(d => d.directionCardinal);
      const modeDirection = directions.sort((a, b) =>
        directions.filter(v => v === a).length - directions.filter(v => v === b).length
      ).pop() || '';
      const avgDirectionDegrees = Math.round(dayData.reduce((sum, item) => sum + item.direction, 0) / dayData.length);
      return {
        speed: avgSpeed,
        gusts: avgGusts,
        direction: avgDirectionDegrees,
        directionCardinal: modeDirection,
        isAverage: true
      };
    }
  };

  const currentWind = getCurrentWind();

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
          <p style={{ color: 'var(--color-wind)' }}>
            Speed: {data.speed} mph {data.directionCardinal}
          </p>
          <p style={{ color: 'var(--color-wind-secondary)' }}>
            Gusts: {data.gusts} mph
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Direction: {data.direction}°
          </p>
        </div>
      );
    }
    return null;
  };

  // Wind direction arrow component for header
  // Arrow points in the direction the wind is coming FROM (add 180° to show source)
  const WindArrow = ({ direction }: { direction: number }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ transform: `rotate(${direction + 180}deg)` }}>
      <path
        d="M12 2 L16 10 L12 8 L8 10 Z"
        fill="var(--color-wind)"
        stroke="var(--color-wind)"
        strokeWidth="1"
      />
      <line x1="12" y1="8" x2="12" y2="20" stroke="var(--color-wind)" strokeWidth="2" />
    </svg>
  );

  // Custom dot with wind direction arrow for chart points
  // Arrow points in the direction the wind is coming FROM (add 180° to show source)
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload || payload.direction === undefined) return null;

    return (
      <g transform={`translate(${cx}, ${cy})`}>
        <g transform={`rotate(${payload.direction + 180})`}>
          {/* Arrow pointing down, will be rotated to show wind direction FROM */}
          <path
            d="M0,-8 L3,0 L0,-2 L-3,0 Z"
            fill="var(--color-wind)"
            stroke="white"
            strokeWidth="0.5"
          />
          <line x1="0" y1="-2" x2="0" y2="6" stroke="var(--color-wind)" strokeWidth="1.5" />
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
        No wind data available for this day
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h2 style={{
            fontSize: '1.25rem',
            margin: 0,
            color: 'var(--color-wind)'
          }}>
            MARINE WIND CONDITIONS
          </h2>
        </div>
        {currentWind && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-wind)' }}>
                {Math.round(currentWind.speed)} mph
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                {'isAverage' in currentWind ? 'Avg Wind' : 'Current Wind'}
              </div>
              {isToday && (
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Gusts: {Math.round(currentWind.gusts)} mph
                </div>
              )}
            </div>
            <WindArrow direction={currentWind.direction} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {currentWind.directionCardinal}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={140} className="wind-chart">
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
            domain={[0, 23]}
            ticks={[0, 6, 12, 18]}
          />
          <YAxis
            stroke="var(--color-text-secondary)"
            style={{ fontSize: '0.75rem' }}
            label={{ value: 'mph', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-text-secondary)' } }}
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
            dataKey="speed"
            stroke="var(--color-wind)"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 8 }}
            name="Wind Speed"
          />
          <Line
            type="monotone"
            dataKey="gusts"
            stroke="var(--color-wind-secondary)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            name="Gusts"
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
            <line x1="0" y1="1.5" x2="30" y2="1.5" stroke="var(--color-wind)" strokeWidth="2" />
          </svg>
          <span style={{ color: 'var(--color-text-secondary)' }}>Wind Speed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="30" height="3" viewBox="0 0 30 3">
            <line x1="0" y1="1.5" x2="30" y2="1.5" stroke="var(--color-wind-secondary)" strokeWidth="2" strokeDasharray="5 5" />
          </svg>
          <span style={{ color: 'var(--color-text-secondary)' }}>Wind Gusts</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <g transform="translate(8, 8) rotate(0)">
              <path
                d="M0,-6 L2,0 L0,-1.5 L-2,0 Z"
                fill="var(--color-wind)"
                stroke="white"
                strokeWidth="0.5"
              />
              <line x1="0" y1="-1.5" x2="0" y2="4" stroke="var(--color-wind)" strokeWidth="1.5" />
            </g>
          </svg>
          <span style={{ color: 'var(--color-text-secondary)' }}>Wind Direction</span>
        </div>
      </div>

      {/* Model Confidence */}
      {multiModelData && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
          <ConfidenceBadge
            confidenceScores={multiModelData.confidence}
            selectedDay={selectedDay}
            relevantParams={['windSpeed', 'windGusts', 'windDirection']}
            onCompareModels={onCompareModels}
          />
        </div>
      )}
    </div>
  );
}

export default WindChart;
