import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css'; // Reuse auth modal styles

interface ContactModalProps {
  onClose: () => void;
}

export default function ContactModal({ onClose }: ContactModalProps) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim()) {
      setError('Please enter a subject.');
      return;
    }
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          userEmail: user?.email || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to send message. Please try again.');
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          <div className="auth-modal-header">
            <h2>Message Sent</h2>
            <button className="close-button" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="auth-modal-body">
            <div style={{
              textAlign: 'center',
              padding: '1rem 0',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" style={{ marginBottom: '1rem' }}>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                Thanks for reaching out! We'll get back to you as soon as possible.
              </p>
              <button className="submit-button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>Contact Us</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="auth-modal-body">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            Have a question or feedback? Send us a message and we'll get back to you.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-field" style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="contact-subject"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.375rem',
                }}
              >
                Subject
              </label>
              <input
                id="contact-subject"
                type="text"
                className="auth-input"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="What's this about?"
                maxLength={200}
                disabled={isLoading}
              />
            </div>

            <div className="form-field" style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="contact-message"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.375rem',
                }}
              >
                Message
              </label>
              <textarea
                id="contact-message"
                className="auth-input"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={5}
                maxLength={2000}
                disabled={isLoading}
                style={{
                  resize: 'vertical',
                  minHeight: '100px',
                  fontFamily: 'inherit',
                }}
              />
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

            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner" />
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
