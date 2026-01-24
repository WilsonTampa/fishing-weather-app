import { useEffect, useRef } from 'react';

interface DaySelectorProps {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
}

function DaySelector({ selectedDay, onSelectDay }: DaySelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate array of next 10 days
  const days: Date[] = [];
  for (let i = 0; i < 10; i++) {
    const day = new Date();
    day.setDate(day.getDate() + i);
    day.setHours(0, 0, 0, 0);
    days.push(day);
  }

  // Scroll selected day into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedIndex = days.findIndex(
        day => day.toDateString() === selectedDay.toDateString()
      );
      if (selectedIndex !== -1) {
        const container = scrollContainerRef.current;
        const selectedElement = container.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
          const containerWidth = container.clientWidth;
          const elementWidth = selectedElement.clientWidth;
          const scrollLeft = selectedElement.offsetLeft - (containerWidth / 2) + (elementWidth / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    }
  }, [selectedDay]);

  const isSelected = (day: Date) => {
    return day.toDateString() === selectedDay.toDateString();
  };

  const isToday = (day: Date) => {
    const today = new Date();
    return day.toDateString() === today.toDateString();
  };

  const formatDay = (day: Date) => {
    if (isToday(day)) return 'Today';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (day.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return day.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatDate = (day: Date) => {
    return day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '1rem',
      marginBottom: '1.5rem',
      overflowX: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: 'var(--color-border) transparent'
    }}>
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: '0.75rem',
          minWidth: 'min-content'
        }}
      >
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => onSelectDay(day)}
            style={{
              minWidth: '90px',
              padding: '0.75rem 1rem',
              backgroundColor: isSelected(day) ? 'var(--color-accent)' : 'var(--color-background)',
              border: isSelected(day) ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: isSelected(day) ? 'white' : 'var(--color-text-primary)',
              fontWeight: isSelected(day) ? 600 : 400,
              textAlign: 'center',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isSelected(day)) {
                e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                e.currentTarget.style.borderColor = 'var(--color-accent)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected(day)) {
                e.currentTarget.style.backgroundColor = 'var(--color-background)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }
            }}
          >
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '0.25rem'
            }}>
              {formatDay(day)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              opacity: 0.8,
              marginBottom: '0.25rem'
            }}>
              {formatDate(day)}
            </div>
            <div style={{
              fontSize: '1.25rem',
              marginTop: '0.25rem'
            }}>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default DaySelector;
