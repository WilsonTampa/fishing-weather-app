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
  const getPressureInfo = (): PressureInfo | null => {
    if (!pressureData || pressureData.length === 0) return null;

    const startOfDay = new Date(selectedDay);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDay);
    endOfDay.setHours(23, 59, 59, 999);

    const dayPressure = pressureData.filter(item => {
      const timestamp = new Date(item.timestamp);
      return timestamp >= startOfDay && timestamp <= endOfDay;
    });

    if (dayPressure.length < 2) return null;

    const now = new Date();
    const isToday = now >= startOfDay && now <= endOfDay;

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

  if (!pressureInfo) return null;

  const fishingCondition = getFishingCondition(pressureInfo.trend);

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
            color: getTrendColor(pressureInfo.trend)
          }}
        >
          BAROMETRIC PRESSURE
        </h2>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getTrendColor(pressureInfo.trend) }}>
            {pressureInfo.current.toFixed(2)} in
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {pressureInfo.change >= 0 ? '+' : ''}{pressureInfo.change.toFixed(3)} in / 3hr
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Trend */}
        <div style={{ flex: '1', minWidth: '150px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Trend
          </div>
          <div
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${getTrendColor(pressureInfo.trend)}`,
              color: getTrendColor(pressureInfo.trend),
              fontWeight: 600,
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {pressureInfo.trend === 'RISING' && '↑'}
            {pressureInfo.trend === 'FALLING' && '↓'}
            {pressureInfo.trend === 'STABLE' && '→'}
            {pressureInfo.trend}
          </div>
        </div>

        {/* Fishing Conditions */}
        <div style={{ flex: '2', minWidth: '200px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Fishing Conditions
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: fishingCondition.color
              }}
            />
            <span style={{ fontWeight: 600, color: fishingCondition.color }}>
              {fishingCondition.label}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
            {fishingCondition.description}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#22C55E', fontWeight: 600 }}>↑ RISING</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>Very Good</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#3B82F6', fontWeight: 600 }}>→ STABLE</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>Good</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#EF4444', fontWeight: 600 }}>↓ FALLING</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>Fair</span>
        </div>
      </div>
    </div>
  );
}

export default BarometricPressure;
