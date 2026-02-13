import { useState } from 'react';
import './SaveLocationBanner.css';

interface SaveLocationBannerProps {
  locationName: string;
  onSignup: () => void;
}

export default function SaveLocationBanner({ locationName, onSignup }: SaveLocationBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('saveLocationBannerDismissed') === 'true';
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('saveLocationBannerDismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="save-location-banner">
      <div className="save-location-banner__content">
        <svg className="save-location-banner__icon" width="18" height="18" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <div className="save-location-banner__text">
          <span>
            Create a free account to save your location for next time — <strong>{locationName}</strong>
          </span>
        </div>
      </div>
      <div className="save-location-banner__actions">
        <button className="save-location-banner__cta" onClick={onSignup}>
          Create Account
        </button>
        <button className="save-location-banner__dismiss" onClick={handleDismiss} aria-label="Dismiss">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
