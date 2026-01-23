import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WeatherData } from '../types';

interface WeatherConditionsChartProps {
  data: WeatherData[];
  selectedDay: Date;
}

function WeatherConditionsChart({ data, selectedDay }: WeatherConditionsChartProps) {
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
      time: time.getHours(),
      timeLabel: time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      precipitation: item.precipitationProbability,
      fullTimestamp: item.timestamp
    };
  });

  // Get current conditions (first data point of selected day)
  const currentConditions = dayData[0] || null;

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
          <p style={{ color: '#60A5FA' }}>
            Rain Chance: {data.precipitation}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-text-secondary)'
      }}>
        No weather data available for this day
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
        paddingBottom: '0.75rem'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          margin: 0,
          color: '#60A5FA'
        }}>
          🌧️ MARINE WEATHER CONDITIONS
        </h2>
        {currentConditions && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60A5FA' }}>
              {currentConditions.precipitationProbability}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Rain Chance
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={140} className="weather-chart">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            label={{ value: '%', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-text-secondary)' } }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="precipitation"
            fill="#60A5FA"
            fillOpacity={0.8}
            name="Rain Chance"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default WeatherConditionsChart;
