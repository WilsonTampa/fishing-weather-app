import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './DaySelector.css';

interface DaySelectorProps {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  onLockedDayClick?: () => void;
}

function DaySelector({ selectedDay, onSelectDay, onLockedDayClick }: DaySelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { canAccessFutureDays, isConfigured } = useAuth();

  // Generate array of next 8 days (today + 7)
  const days: Date[] = [];
  for (let i = 0; i < 8; i++) {
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

  // Day is locked if: auth is configured AND user can't access future days AND it's not today
  const isLocked = (index: number) => {
    return isConfigured && !canAccessFutureDays && index > 0;
  };

  const formatDay = (day: Date) => {
    if (isToday(day)) return 'Today';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (day.toDateString() === tomorrow.toDateString()) return 'Tmrw';
    return day.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatDate = (day: Date) => {
    return `${day.getMonth() + 1}/${day.getDate()}`;
  };

  const handleDayClick = (day: Date, index: number) => {
    // Today is always free
    if (index === 0) {
      onSelectDay(day);
      return;
    }

    // Check if day is locked
    if (isLocked(index)) {
      onLockedDayClick?.();
      return;
    }

    onSelectDay(day);
  };

  return (
    <div className="day-selector" style={{
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '0.375rem',
      marginBottom: 0,
    }}>
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: '3px',
        }}
      >
        {days.map((day, index) => {
          const locked = isLocked(index);
          const selected = isSelected(day);

          return (
            <button
              key={index}
              onClick={() => handleDayClick(day, index)}
              className="day-selector__btn"
              style={{
                flex: '1 1 0',
                minWidth: 0,
                padding: '0.3rem 0.15rem',
                backgroundColor: selected ? 'var(--color-accent)' : 'var(--color-background)',
                border: selected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: selected ? 'white' : 'var(--color-text-primary)',
                fontWeight: selected ? 600 : 400,
                textAlign: 'center',
                outline: 'none',
                position: 'relative',
                opacity: locked ? 0.7 : 1,
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  e.currentTarget.style.borderColor = locked ? 'var(--color-border)' : 'var(--color-accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }
              }}
              aria-label={locked ? `${formatDay(day)} - Premium feature` : formatDay(day)}
            >
              <div className="day-selector__label">
                <span className="day-selector__day">{formatDay(day)}</span>
                <span className="day-selector__date">{formatDate(day)}</span>
                {locked && (
                  <svg
                    className="day-selector__lock"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DaySelector;
