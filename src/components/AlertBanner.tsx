import { useState } from 'react';
import { MarineAlert } from '../types';

interface AlertBannerProps {
  alerts: MarineAlert[];
  selectedDay: Date;
}

/**
 * Displays Small Craft Advisory banners for the selected day.
 * Only shows alerts whose onset–ends window overlaps the selected day.
 */
export default function AlertBanner({ alerts, selectedDay }: AlertBannerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!alerts || alerts.length === 0) return null;

  // Filter alerts that overlap the selected day
  const startOfDay = new Date(selectedDay);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDay);
  endOfDay.setHours(23, 59, 59, 999);

  const activeAlerts = alerts.filter(alert => {
    const onset = new Date(alert.onset);
    const ends = new Date(alert.ends);
    // Alert overlaps the selected day if it starts before end of day AND ends after start of day
    return onset <= endOfDay && ends >= startOfDay;
  });

  if (activeAlerts.length === 0) return null;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {activeAlerts.map((alert, i) => (
        <div
          key={i}
          style={{
            backgroundColor: '#7C2D12',
            border: '1px solid #F97316',
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
          }}
          onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
        >
          {/* Header row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            {/* Warning triangle icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FCD34D"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>

            <div style={{ flex: 1 }}>
              <span style={{
                fontWeight: 700,
                color: '#FCD34D',
                fontSize: '0.9rem',
              }}>
                {alert.event}
              </span>
              <span style={{
                color: '#FDBA74',
                fontSize: '0.8rem',
                marginLeft: '0.75rem',
              }}>
                {formatTime(alert.onset)} — {formatTime(alert.ends)}
              </span>
            </div>

            {/* Expand/collapse chevron */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FDBA74"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                flexShrink: 0,
                transition: 'transform 0.2s ease',
                transform: expandedIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Expanded details */}
          {expandedIndex === i && (
            <div style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(249, 115, 22, 0.3)',
              fontSize: '0.85rem',
              color: '#FDE68A',
              lineHeight: 1.5,
            }}>
              <p style={{ whiteSpace: 'pre-line', margin: 0 }}>
                {alert.description}
              </p>
              {alert.instruction && (
                <p style={{
                  marginTop: '0.5rem',
                  marginBottom: 0,
                  color: '#FDBA74',
                  fontStyle: 'italic',
                }}>
                  {alert.instruction}
                </p>
              )}
              <p style={{
                marginTop: '0.5rem',
                marginBottom: 0,
                fontSize: '0.75rem',
                color: '#FB923C',
              }}>
                Source: {alert.senderName}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
