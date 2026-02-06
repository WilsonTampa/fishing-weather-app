import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validatePassword, getPasswordStrength } from '../utils/passwordValidation';
import './AuthModal.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(`Password must have: ${validation.errors.join(', ').toLowerCase()}`);
      return;
    }

    setIsLoading(true);
    try {
      if (!supabase) throw new Error('Auth not configured');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" style={{ position: 'fixed', cursor: 'default' }}>
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>{success ? 'Password Updated' : 'Set New Password'}</h2>
        </div>
        <div className="auth-modal-body">
          {success ? (
            <div className="email-sent">
              <div className="email-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p>Your password has been updated successfully.</p>
              <button
                className="submit-button"
                onClick={() => navigate('/forecast')}
                style={{ marginTop: '1rem' }}
              >
                Continue to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  type="password"
                  id="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  autoFocus
                />
                {password.length > 0 && (
                  <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color:
                    getPasswordStrength(password) === 'strong' ? '#10B981'
                    : getPasswordStrength(password) === 'fair' ? '#F59E0B'
                    : '#EF4444'
                  }}>
                    Password strength: {getPasswordStrength(password)}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
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

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? <span className="loading-spinner" /> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
