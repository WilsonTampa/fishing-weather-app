import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createSavedLocation } from '../services/savedLocations';
import './AuthModal.css';

interface SaveLocationModalProps {
  latitude: number;
  longitude: number;
  tideStationId: string | null;
  onClose: () => void;
  onSaved: () => void;
  onOpenAuth: () => void;
  onOpenUpgrade: () => void;
}

export default function SaveLocationModal({
  latitude,
  longitude,
  tideStationId,
  onClose,
  onSaved,
  onOpenAuth,
  onOpenUpgrade,
}: SaveLocationModalProps) {
  const { user, canSaveLocations, isEmailVerified } = useAuth();
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Not logged in
  if (!user) {
    return (
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          <div className="auth-modal-header">
            <h2>Save Location</h2>
            <button className="close-button" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="auth-modal-body">
            <div className="upgrade-prompt">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>Saved locations is a Pro feature</span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Sign up to save your favorite locations for quick access.
            </p>
            <button
              className="submit-button"
              onClick={() => { onClose(); onOpenAuth(); }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in but not paid
  if (!canSaveLocations) {
    return (
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          <div className="auth-modal-header">
            <h2>Save Location</h2>
            <button className="close-button" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="auth-modal-body">
            <div className="upgrade-prompt">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>Saved locations is a Pro feature</span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Upgrade to Pro to save unlimited locations and switch between them instantly.
            </p>
            <button
              className="submit-button"
              onClick={() => { onClose(); onOpenUpgrade(); }}
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a name for this location.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await createSavedLocation(user.id, trimmed, latitude, longitude, tideStationId, isDefault);
      onSaved();
      onClose();
    } catch {
      if (!isEmailVerified) {
        setError('Please verify your email before saving locations. Check your inbox for the verification link.');
      } else {
        setError('Failed to save location. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="auth-modal-header">
          <h2>Save Location</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="auth-modal-body">
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}>
              Location Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tampa Bay, Home Dock"
              maxLength={60}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            marginBottom: '1.25rem',
          }}>
            <input
              type="checkbox"
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              style={{ accentColor: 'var(--color-accent)' }}
            />
            Set as default location
          </label>

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

          <button
            className="submit-button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? <span className="loading-spinner" /> : 'Save Location'}
          </button>
        </div>
      </div>
    </div>
  );
}
