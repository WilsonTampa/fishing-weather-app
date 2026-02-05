import { Component, type ReactNode } from 'react';
import { captureError } from '../lib/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches unhandled React rendering errors and displays a fallback UI
 * instead of crashing the entire app. Also reports errors to Sentry.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureError(error, {
      componentStack: errorInfo.componentStack ?? 'unknown',
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: 'var(--color-background, #0f1923)',
          color: 'var(--color-text-primary, #e5e7eb)',
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '400px',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something Went Wrong</h1>
            <p style={{
              color: 'var(--color-text-secondary, #9ca3af)',
              marginBottom: '1.5rem',
              lineHeight: '1.6',
            }}>
              An unexpected error occurred. This has been reported automatically.
              Try refreshing the page.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--color-accent, #58a6ff)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary, #9ca3af)',
                  border: '1px solid var(--color-border, #2d3748)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
