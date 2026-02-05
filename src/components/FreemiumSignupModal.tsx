import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createSavedLocation } from '../services/savedLocations';
import { supabase } from '../lib/supabase';
import './FreemiumSignupModal.css';

interface FreemiumSignupModalProps {
  locationName: string;
  latitude: number;
  longitude: number;
  tideStationId?: string;
  onClose: () => void;
  onSignupComplete: () => void;
}

type ModalView = 'comparison' | 'signup' | 'login' | 'success';

export default function FreemiumSignupModal({ locationName, latitude, longitude, tideStationId, onClose, onSignupComplete }: FreemiumSignupModalProps) {
  const [view, setView] = useState<ModalView>('comparison');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [resendSuccess, setResendSuccess] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);

  const { signUpWithEmail, signInWithEmail, resendVerificationEmail } = useAuth();

  const saveLocationToDatabase = async (userId: string) => {
    try {
      await createSavedLocation(userId, locationName, latitude, longitude, tideStationId ?? null, true);
    } catch (err) {
      console.error('Error saving location after signup:', err);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error, user: newUser } = await signUpWithEmail(email, password);
      if (error) throw error;
      setView('success');
      // Save the location for the new user (works even without a session
      // since signUpWithEmail returns the user directly)
      if (newUser) {
        await saveLocationToDatabase(newUser.id);
      }
      // Don't call onSignupComplete here — it unmounts the modal before
      // the user sees the success screen. Instead, call it from "Continue to Dashboard".
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setResendSuccess(false);
    try {
      const { error } = await resendVerificationEmail(email);
      if (error) throw error;
      setResendSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend email';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          setShowResendVerification(true);
          setError(null);
          return;
        }
        throw error;
      }
      // Save the location to DB for the logged-in user
      if (supabase) {
        const { data: { user: loggedInUser } } = await supabase.auth.getUser();
        if (loggedInUser) {
          await saveLocationToDatabase(loggedInUser.id);
        }
      }
      onSignupComplete();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  // Resend verification view (shown when login fails due to unverified email)
  if (showResendVerification) {
    return (
      <div className="freemium-modal-overlay">
        <div className="freemium-modal" onClick={e => e.stopPropagation()}>
          <div className="freemium-modal-header">
            <h2>Verify Your Email</h2>
            <button className="close-button" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="freemium-modal-body">
            <div className="freemium-success">
              <div className="freemium-success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p>Your account exists but your email hasn't been verified yet.</p>
              <p className="email-address">{email}</p>
              {resendSuccess ? (
                <p style={{ color: 'var(--color-accent)' }}>Verification email sent! Check your inbox.</p>
              ) : (
                <p>Click below to resend the verification link.</p>
              )}
              {error && (
                <div className="error-message">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
            <button
              className="freemium-cta-primary"
              onClick={handleResendVerification}
              disabled={isLoading || resendSuccess}
              style={{ marginTop: '1rem' }}
            >
              {isLoading ? <span className="loading-spinner" /> : resendSuccess ? 'Email Sent!' : 'Resend Verification Email'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success view after signup
  if (view === 'success') {
    return (
      <div className="freemium-modal-overlay">
        <div className="freemium-modal" onClick={e => e.stopPropagation()}>
          <div className="freemium-modal-header">
            <h2>Check Your Email</h2>
            <button className="close-button" onClick={() => { onSignupComplete(); onClose(); }} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="freemium-modal-body">
            <div className="freemium-success">
              <div className="freemium-success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p>We sent a verification link to</p>
              <p className="email-address">{email}</p>
              <p>You can start using the app now! Verify your email to complete setup.</p>
            </div>
            <button className="freemium-cta-primary" onClick={() => { onSignupComplete(); onClose(); }} style={{ marginTop: '1rem' }}>
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Signup form view
  if (view === 'signup' || view === 'login') {
    const isSignup = view === 'signup';
    return (
      <div className="freemium-modal-overlay" onClick={onClose}>
        <div className="freemium-modal" onClick={e => e.stopPropagation()}>
          <div className="freemium-modal-header">
            <h2>{isSignup ? 'Create Free Account' : 'Welcome Back'}</h2>
            <button className="close-button" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="freemium-modal-body">
            <button
              className="freemium-back-link"
              onClick={() => { setView('comparison'); setError(null); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>

            <form className="freemium-signup-form" onSubmit={isSignup ? handleSignup : handleLogin}>
              <div className="form-group">
                <label htmlFor="freemium-email">Email</label>
                <input
                  type="email"
                  id="freemium-email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="freemium-password">Password</label>
                <input
                  type="password"
                  id="freemium-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
              </div>

              {error && (
                <div className="error-message">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="freemium-cta-primary" disabled={isLoading}>
                {isLoading ? (
                  <span className="loading-spinner" />
                ) : (
                  isSignup ? 'Create Free Account' : 'Sign In'
                )}
              </button>
            </form>

            <div className="freemium-auth-switch">
              {isSignup ? (
                <p>
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setView('login'); setError(null); }}>
                    Sign in
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setView('signup'); setError(null); }}>
                    Create free account
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: comparison view
  return (
    <div className="freemium-modal-overlay" onClick={onClose}>
      <div className="freemium-modal" onClick={e => e.stopPropagation()}>
        <div className="freemium-modal-header">
          <h2>Save Your Location</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="freemium-modal-body">
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 0, marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
            Create a free account to save <strong style={{ color: 'var(--color-text)' }}>{locationName}</strong> so you don't have to select it again next time.
          </p>

          <div className="freemium-comparison">
            <div className="freemium-tier freemium-tier-free">
              <div className="freemium-tier-label">Always Free:</div>
              <ul>
                <li>{checkIcon} View Today's marine forecast</li>
                <li>{checkIcon} Save your favorite location</li>
              </ul>
            </div>
          </div>

          <div className="freemium-cta">
            <button className="freemium-cta-primary" onClick={() => setView('signup')}>
              Create Free Account
            </button>
            <button className="freemium-cta-secondary" onClick={onClose}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
