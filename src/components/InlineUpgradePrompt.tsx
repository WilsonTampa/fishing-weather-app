import { useAuth } from '../contexts/AuthContext';
import './InlineUpgradePrompt.css';

interface InlineUpgradePromptProps {
  featureDescription: string;
  variant: 'signup' | 'upgrade';
  onSignup: () => void;
  onUpgrade: () => void;
  onDismiss: () => void;
}

const googleIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const lockIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

export default function InlineUpgradePrompt({
  featureDescription,
  variant,
  onSignup,
  onUpgrade,
  onDismiss,
}: InlineUpgradePromptProps) {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in failed:', err);
    }
  };

  return (
    <div className="inline-upgrade-prompt">
      <button className="inline-upgrade-prompt__dismiss" onClick={onDismiss} aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="inline-upgrade-prompt__content">
        <div className="inline-upgrade-prompt__icon">{lockIcon}</div>
        <div className="inline-upgrade-prompt__text">
          {variant === 'signup' ? (
            <>
              <div className="inline-upgrade-prompt__title">
                Sign up free to unlock {featureDescription.toLowerCase()}
              </div>
              <div className="inline-upgrade-prompt__subtitle">
                Plus get a free 7-day Pro trial
              </div>
            </>
          ) : (
            <>
              <div className="inline-upgrade-prompt__title">
                Start your 7-day free trial to unlock {featureDescription.toLowerCase()}
              </div>
              <div className="inline-upgrade-prompt__subtitle">
                $7.99/mo after trial &middot; Cancel anytime
              </div>
            </>
          )}
        </div>
      </div>

      <div className="inline-upgrade-prompt__actions">
        {variant === 'signup' ? (
          <>
            <button className="inline-upgrade-prompt__google" onClick={handleGoogleSignIn}>
              {googleIcon}
              Continue with Google
            </button>
            <button className="inline-upgrade-prompt__cta" onClick={onSignup}>
              Sign Up with Email
            </button>
          </>
        ) : (
          <button className="inline-upgrade-prompt__cta" onClick={onUpgrade}>
            Start 7-Day Free Trial
          </button>
        )}
      </div>
    </div>
  );
}
