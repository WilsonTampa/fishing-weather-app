import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createSavedLocation } from '../services/savedLocations';
import './AuthModal.css';

interface SaveLocationPromptProps {
  locationName: string;
  latitude: number;
  longitude: number;
  tideStationId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function SaveLocationPrompt({
  locationName,
  latitude,
  longitude,
  tideStationId,
  onClose,
  onSaved,
}: SaveLocationPromptProps) {
  const { user, isEmailVerified } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      await createSavedLocation(user.id, locationName, latitude, longitude, tideStationId, false);
      setShowSuccess(true);
      onSaved();
      // Auto-close after showing success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      if (!isEmailVerified) {
        setError('Please verify your email before saving locations. Check your inbox for the verification link.');
      } else {
        setError('Failed to save location. Please try again.');
      }
      setIsSaving(false);
    }
  };

  // Show success message
  if (showSuccess) {
    return (
      <div className="auth-modal-overlay">
        <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
          <div className="auth-modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Location Saved!</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {locationName} has been added to your saved locations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="auth-modal-header">
          <h2>Save Location?</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="auth-modal-body">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{locationName}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Add to your saved locations for quick access
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              No Thanks
            </button>
            <button
              className="submit-button"
              onClick={handleSave}
              disabled={isSaving}
              style={{ flex: 1 }}
            >
              {isSaving ? <span className="loading-spinner" /> : 'Yes, Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
