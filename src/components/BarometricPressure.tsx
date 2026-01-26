import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PressureData {
  timestamp: string;
  pressure: number;
}

interface BarometricPressureProps {
  pressureData: PressureData[];
  selectedDay: Date;
}

type PressureTrend = 'RISING' | 'STABLE' | 'FALLING';

interface PressureInfo {
  current: number;
  trend: PressureTrend;
  change: number;
}

function BarometricPressure({ pressureData, selectedDay }: BarometricPressureProps) {
  // Filter data for selected day
  const startOfDay = new Date(selectedDay);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDay);
  endOfDay.setHours(23, 59, 59, 999);

  const dayPressure = pressureData.filter(item => {
    const timestamp = new Date(item.timestamp);
    return timestamp >= startOfDay && timestamp <= endOfDay;
  });

  // Format data for chart
  const chartData = dayPressure.map(item => {
    const time = new Date(item.timestamp);
    return {
      time: time.getHours() + time.getMinutes() / 60,
      timeLabel: time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      pressure: item.pressure,
      fullTimestamp: item.timestamp
    };
  });

  // Check if current time is within selected day
  const now = new Date();
  const isToday = now >= startOfDay && now <= endOfDay;
  const currentTime = isToday ? now.getHours() + now.getMinutes() / 60 : null;

  const getPressureInfo = (): PressureInfo | null => {
    if (dayPressure.length < 2) return null;

    let currentIndex = dayPressure.length - 1;
    if (isToday) {
      const currentHour = now.getHours();
      currentIndex = dayPressure.findIndex(p => {
        const hour = new Date(p.timestamp).getHours();
        return hour >= currentHour;
      });
      if (currentIndex === -1) currentIndex = dayPressure.length - 1;
    }

    const current = dayPressure[currentIndex].pressure;
    const hoursBack = 3;
    const compareIndex = Math.max(0, currentIndex - hoursBack);
    const previousPressure = dayPressure[compareIndex].pressure;
    const change = current - previousPressure;

    let trend: PressureTrend;
    if (change > 0.02) {
      trend = 'RISING';
    } else if (change < -0.02) {
      trend = 'FALLING';
    } else {
      trend = 'STABLE';
    }

    return { current, trend, change };
  };

  const pressureInfo = getPressureInfo();

  const getFishingCondition = (trend: PressureTrend): { label: string; color: string; description: string } => {
    switch (trend) {
      case 'RISING':
        return {
          label: 'VERY GOOD',
          color: '#22C55E',
          description: 'Rising pressure indicates improving conditions. Fish are typically more active.'
        };
      case 'STABLE':
        return {
          label: 'GOOD',
          color: '#3B82F6',
          description: 'Stable pressure means normal fish activity. Good conditions for fishing.'
        };
      case 'FALLING':
        return {
          label: 'FAIR',
          color: '#F59E0B',
          description: 'Falling pressure may increase activity initially, then slow as conditions change.'
        };
    }
  };

  const getTrendColor = (trend: PressureTrend): string => {
    switch (trend) {
      case 'RISING': return '#22C55E';
      case 'STABLE': return '#3B82F6';
      case 'FALLING': return '#EF4444';
    }
  };

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
          <p style={{ color: pressureInfo ? getTrendColor(pressureInfo.trend) : '#3B82F6' }}>
            Pressure: {data.pressure.toFixed(2)} in
          </p>
        </div>
      );
    }
    return null;
  };

  if (!pressureInfo || chartData.length === 0) return null;

  const fishingCondition = getFishingCondition(pressureInfo.trend);
  const trendColor = getTrendColor(pressureInfo.trend);

  // Calculate Y-axis domain with some padding
  const pressures = chartData.map(d => d.pressure);
  const minPressure = Math.min(...pressures);
  const maxPressure = Math.max(...pressures);
  const padding = (maxPressure - minPressure) * 0.2 || 0.1;

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            margin: 0,
            color: trendColor
          }}
        >
          BAROMETRIC PRESSURE
        </h2>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: trendColor }}>
            {pressureInfo.current.toFixed(2)} in
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {pressureInfo.trend === 'RISING' && '↑'}
            {pressureInfo.trend === 'FALLING' && '↓'}
            {pressureInfo.trend === 'STABLE' && '→'}
            {' '}{pressureInfo.trend}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={120} className="pressure-chart">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="pressureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={trendColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={trendColor} stopOpacity={0.1}/>
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
            domain={[minPressure - padding, maxPressure + padding]}
            tickFormatter={(value) => value.toFixed(1)}
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
            dataKey="pressure"
            stroke={trendColor}
            strokeWidth={2}
            fill="url(#pressureGradient)"
            dot={{ fill: trendColor, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Fishing Conditions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Fishing Conditions:
          </div>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: fishingCondition.color
            }}
          />
          <span style={{ fontWeight: 600, color: fishingCondition.color, fontSize: '0.875rem' }}>
            {fishingCondition.label}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
          {fishingCondition.description}
        </div>
      </div>
    </div>
  );
}

export default BarometricPressure;
