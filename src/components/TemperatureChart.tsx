import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TemperatureData, WeatherData } from '../types';

interface TemperatureChartProps {
  data: TemperatureData[];
  weatherData: WeatherData[];
  selectedDay: Date;
}

function TemperatureChart({ data, weatherData, selectedDay }: TemperatureChartProps) {
  // Filter data for selected day
  const startOfDay = new Date(selectedDay);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDay);
  endOfDay.setHours(23, 59, 59, 999);

  const dayData = data.filter(item => {
    const timestamp = new Date(item.timestamp);
    return timestamp >= startOfDay && timestamp <= endOfDay;
  });

  const dayWeatherData = weatherData.filter(item => {
    const timestamp = new Date(item.timestamp);
    return timestamp >= startOfDay && timestamp <= endOfDay;
  });

  // Format data for chart
  const chartData = dayData.map((item, index) => {
    const time = new Date(item.timestamp);
    const weather = dayWeatherData[index];
    return {
      time: time.getHours() + time.getMinutes() / 60,
      timeLabel: time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      temperature: Math.round(item.temperature),
      feelsLike: item.feelsLike ? Math.round(item.feelsLike) : undefined,
      cloudCover: weather ? weather.cloudCover : 0,
      fullTimestamp: item.timestamp
    };
  });

  // Calculate average temperature for the day
  const averageTemp = dayData.length > 0
    ? Math.round(dayData.reduce((sum, item) => sum + item.temperature, 0) / dayData.length)
    : null;

  // Calculate high and low for the day
  const temperatures = chartData.map(d => d.temperature);
  const high = temperatures.length > 0 ? Math.max(...temperatures) : null;
  const low = temperatures.length > 0 ? Math.min(...temperatures) : null;

  // Check if current time is within selected day
  const now = new Date();
  const isToday = now >= startOfDay && now <= endOfDay;
  const currentTime = isToday ? now.getHours() + now.getMinutes() / 60 : null;

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
          <p style={{ color: 'var(--color-temperature-warm)' }}>
            Temperature: {data.temperature}°F
          </p>
          {data.feelsLike !== undefined && (
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Feels like: {data.feelsLike}°F
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Get gradient color based on temperature
  const getTemperatureColor = (temp: number): string => {
    if (temp >= 80) return '#F97316'; // Hot - orange
    if (temp >= 70) return '#FBBF24'; // Warm - amber
    if (temp >= 60) return '#4ADE80'; // Mild - green
    if (temp >= 50) return '#38BDF8'; // Cool - sky blue
    return '#60A5FA'; // Cold - blue
  };

  // Get weather icon based on cloud cover
  const getWeatherIcon = (cloudCover: number): string => {
    if (cloudCover >= 75) return '☁️'; // Cloudy
    if (cloudCover >= 50) return '⛅'; // Partly cloudy
    if (cloudCover >= 25) return '🌤️'; // Mostly sunny
    return '☀️'; // Sunny
  };

  if (chartData.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-text-secondary)'
      }}>
        No temperature data available for this day
      </div>
    );
  }

  const gradientColor = averageTemp ? getTemperatureColor(averageTemp) : '#4ADE80';

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
          color: gradientColor
        }}>
          AIR TEMPERATURE & CLOUD COVER
        </h2>
        {averageTemp !== null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: gradientColor }}>
              {averageTemp}°F
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Avg Temp
            </div>
            {high !== null && low !== null && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                H: {high}° L: {low}°
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={120} className="temperature-chart">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <defs>
            <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={gradientColor} stopOpacity={0.1}/>
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
          />
          <YAxis
            stroke="var(--color-text-secondary)"
            style={{ fontSize: '0.75rem' }}
            label={{ value: '°F', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-text-secondary)' } }}
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
            dataKey="temperature"
            stroke={gradientColor}
            strokeWidth={2}
            fill="url(#temperatureGradient)"
            dot={{ fill: gradientColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Weather Icons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '0.5rem',
        fontSize: '1.5rem'
      }}>
        {chartData.filter((_, index) => index % Math.ceil(chartData.length / 8) === 0).slice(0, 8).map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <span>{getWeatherIcon(item.cloudCover)}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              {item.timeLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TemperatureChart;
