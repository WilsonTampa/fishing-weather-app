import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error monitoring.
 * Call this once at app startup (in main.tsx).
 *
 * Set the VITE_SENTRY_DSN environment variable to enable.
 * When not set, Sentry is a no-op — safe for local development.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.log('[sentry] VITE_SENTRY_DSN not configured, error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // 'development' or 'production'
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    // Capture 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Only send errors in production (no noise from dev)
    enabled: import.meta.env.PROD,
    // Don't send PII (email, etc.) to Sentry
    sendDefaultPii: false,
    // Ignore common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Load failed',
      'Failed to fetch',
    ],
  });
}

/**
 * Capture an exception in Sentry with optional context.
 * Use this in catch blocks for important errors.
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  console.error(error);
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Set the current user in Sentry (call on login).
 * Only sends user ID — no email or PII.
 */
export function setSentryUser(userId: string | null) {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}

// Re-export for ErrorBoundary usage
export { Sentry };
