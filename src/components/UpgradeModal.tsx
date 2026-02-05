import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../lib/api';
import './AuthModal.css'; // Reuse auth modal styles

interface UpgradeModalProps {
  onClose: () => void;
  onOpenAuth: () => void;
  featureDescription?: string;
}

export default function UpgradeModal({ onClose, onOpenAuth, featureDescription }: UpgradeModalProps) {
  const { user, tier, subscription } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has already used a trial (had a trial_ends_at set at some point)
  const hasUsedTrial = !!subscription?.trial_ends_at;

  const checkIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  // If user is not logged in, prompt them to create an account first
  if (!user) {
    return (
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          <div className="auth-modal-header">
            <h2>Upgrade to Pro</h2>
            <button className="close-button" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="auth-modal-body">
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem', textAlign: 'center' }}>
              Create a free account first, then start your 7-day free trial to access all Pro features:
            </p>
            <div className="trial-benefits" style={{ marginBottom: '1.5rem' }}>
              <ul>
                <li>{checkIcon} View forecast up to 7 days in advance</li>
                <li>{checkIcon} Customize your forecast dashboard</li>
                <li>{checkIcon} Save unlimited locations</li>
              </ul>
            </div>
            <button
              className="submit-button"
              onClick={() => { onClose(); onOpenAuth(); }}
            >
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle checkout — with or without trial
  const handleCheckout = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const priceId = selectedPlan === 'annual'
        ? import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID
        : import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID;

      if (!priceId) {
        // Fallback: show message that pricing is not configured
        setError('Payment is not configured yet. Please try again later.');
        setIsLoading(false);
        return;
      }

      // Include 7-day trial if user hasn't used one before
      const trialDays = hasUsedTrial ? undefined : 7;

      const response = await authenticatedFetch('/api/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          priceId,
          trialDays,
          successUrl: `${window.location.origin}/forecast?upgraded=true`,
          cancelUrl: window.location.href
        })
      });

      const { url, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);

      window.location.href = url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(message);
      setIsLoading(false);
    }
  };

  const monthlyPrice = 4.99;
  const annualPrice = 45;
  const monthlySavings = Math.round((1 - (annualPrice / 12) / monthlyPrice) * 100);

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="auth-modal-header">
          <h2>Upgrade to Pro</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="auth-modal-body">
          {featureDescription && (
            <div className="upgrade-prompt">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>{featureDescription}</span>
            </div>
          )}

          {/* Features list */}
          <div className="trial-benefits" style={{ marginBottom: '1.5rem' }}>
            <h3>Upgrade to Pro to unlock:</h3>
            <ul>
              <li>{checkIcon} View forecast up to 7 days in advance</li>
              <li>{checkIcon} Customize your forecast dashboard</li>
              <li>{checkIcon} Save unlimited locations</li>
            </ul>
          </div>

          {/* Pricing options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {/* Annual plan */}
            <button
              onClick={() => setSelectedPlan('annual')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: selectedPlan === 'annual' ? 'rgba(88, 166, 255, 0.1)' : 'var(--color-background)',
                border: selectedPlan === 'annual' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Annual</span>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.125rem 0.375rem',
                    backgroundColor: '#10B981',
                    color: 'white',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    Save {monthlySavings}%
                  </span>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  ${(annualPrice / 12).toFixed(2)}/month, billed annually
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  ${annualPrice}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>per year</div>
              </div>
            </button>

            {/* Monthly plan */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: selectedPlan === 'monthly' ? 'rgba(88, 166, 255, 0.1)' : 'var(--color-background)',
                border: selectedPlan === 'monthly' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Monthly</span>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Flexible, cancel anytime
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  ${monthlyPrice}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>per month</div>
              </div>
            </button>
          </div>

          {tier === 'trial' && (
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid #F59E0B',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#F59E0B'
            }}>
              You're currently on a free trial. Upgrade now to keep access after your trial ends.
            </div>
          )}

          {tier === 'free' && !hasUsedTrial && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10B981',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#10B981'
            }}>
              You won't be charged until the trial ends, cancel at any time.
            </div>
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

          <button
            className="submit-button"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner" />
            ) : !hasUsedTrial ? (
              'Start 7-Day Free Trial'
            ) : (
              `Subscribe - $${selectedPlan === 'annual' ? annualPrice + '/year' : monthlyPrice + '/month'}`
            )}
          </button>

          <p style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            marginTop: '1rem',
            marginBottom: 0
          }}>
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
