import './MapOnboarding.css';

interface MapOnboardingProps {
  onDismiss: () => void;
}

function MapOnboarding({ onDismiss }: MapOnboardingProps) {
  return (
    <div className="map-onboarding-backdrop" onClick={onDismiss}>
      <div className="map-onboarding-card" onClick={e => e.stopPropagation()}>
        <button className="map-onboarding-close" onClick={onDismiss} aria-label="Close">
          ✕
        </button>

        <div className="map-onboarding-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>

        <h2>Choose Your Location</h2>
        <p>Choose a tide station to display the marine forecast for that location</p>
      </div>
    </div>
  );
}

export default MapOnboarding;
