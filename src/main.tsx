import React from 'react'
import ReactDOM from 'react-dom/client'
import { initSentry } from './lib/sentry'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'

// Initialize Sentry before rendering (no-op if VITE_SENTRY_DSN is not set)
initSentry()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
