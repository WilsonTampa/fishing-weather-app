import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MapView from './components/MapView';
import ForecastView from './components/ForecastView';
import AppLayout from './components/AppLayout';
import SaveLocationModal from './components/SaveLocationModal';
import SaveLocationPrompt from './components/SaveLocationPrompt';
import LearnPage from './components/LearnPage';
import ArticlePage from './components/ArticlePage';
import WindMap from './components/WindMap';
import FreemiumSignupModal from './components/FreemiumSignupModal';
import { Location } from './types';
import './styles/global.css';

function ForecastViewWithLayout({ location, onLocationChange, onLocationUpdate, showSavePromptOnLoad, onSavePromptHandled, isTemporaryLocation, onLocationSaved }: {
  location: Location;
  onLocationChange: () => void;
  onLocationUpdate?: () => void;
  showSavePromptOnLoad?: boolean;
  onSavePromptHandled?: () => void;
  isTemporaryLocation?: boolean;
  onLocationSaved?: () => void;
}) {
  const [showStationSelector, setShowStationSelector] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSaveLocationModal, setShowSaveLocationModal] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showFreemiumSignup, setShowFreemiumSignup] = useState(false);
  const [savedLocationsRefreshKey, setSavedLocationsRefreshKey] = useState(0);

  // Show save prompt when navigating from map (for paid/trial users)
  useEffect(() => {
    if (showSavePromptOnLoad) {
      setShowSavePrompt(true);
      if (onSavePromptHandled) {
        onSavePromptHandled();
      }
    }
  }, [showSavePromptOnLoad, onSavePromptHandled]);

  // Show freemium signup modal every time a guest arrives with a temporary location.
  // Triggers on first visit AND every subsequent location change while still a guest.
  useEffect(() => {
    if (isTemporaryLocation) {
      // Short delay so user can see the dashboard first
      const timer = setTimeout(() => {
        setShowFreemiumSignup(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isTemporaryLocation, location]);

  const handleSelectSavedLocation = (lat: number, lng: number, tideStationId: string | null, name: string) => {
    const newLocation: Location = {
      latitude: lat,
      longitude: lng,
      name,
      tideStationId: tideStationId ?? undefined,
    };
    localStorage.setItem('savedLocation', JSON.stringify(newLocation));
    if (onLocationUpdate) {
      onLocationUpdate();
    }
  };

  return (
    <AppLayout
      onLocationChange={onLocationChange}
      onOpenStationSelector={() => setShowStationSelector(true)}
      onOpenAuth={() => setShowAuthModal(true)}
      onOpenUpgrade={() => setShowUpgradeModal(true)}
      onSaveLocation={() => setShowSaveLocationModal(true)}
      onSelectSavedLocation={handleSelectSavedLocation}
      savedLocationsRefreshKey={savedLocationsRefreshKey}
    >
      <ForecastView
        location={location}
        onLocationChange={onLocationChange}
        onLocationUpdate={onLocationUpdate}
        showStationSelector={showStationSelector}
        onCloseStationSelector={() => setShowStationSelector(false)}
        showAuthModal={showAuthModal}
        onCloseAuthModal={() => setShowAuthModal(false)}
        showUpgradeModal={showUpgradeModal}
        onCloseUpgradeModal={() => setShowUpgradeModal(false)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onOpenUpgradeModal={() => setShowUpgradeModal(true)}
      />

      {/* Save Location Modal (manual save with custom name) */}
      {showSaveLocationModal && (
        <SaveLocationModal
          latitude={location.latitude}
          longitude={location.longitude}
          tideStationId={location.tideStationId ?? null}
          onClose={() => setShowSaveLocationModal(false)}
          onSaved={() => setSavedLocationsRefreshKey(prev => prev + 1)}
          onOpenAuth={() => { setShowSaveLocationModal(false); setShowAuthModal(true); }}
          onOpenUpgrade={() => { setShowSaveLocationModal(false); setShowUpgradeModal(true); }}
        />
      )}

      {/* Save Location Prompt (auto-prompt after selecting location from map for trial/paid users) */}
      {showSavePrompt && location.name && (
        <SaveLocationPrompt
          locationName={location.name}
          latitude={location.latitude}
          longitude={location.longitude}
          tideStationId={location.tideStationId ?? null}
          onClose={() => setShowSavePrompt(false)}
          onSaved={() => setSavedLocationsRefreshKey(prev => prev + 1)}
        />
      )}

      {/* Freemium Signup Modal (shown to guests after they see the dashboard) */}
      {showFreemiumSignup && isTemporaryLocation && location.name && (
        <FreemiumSignupModal
          locationName={location.name}
          latitude={location.latitude}
          longitude={location.longitude}
          tideStationId={location.tideStationId}
          onClose={() => setShowFreemiumSignup(false)}
          onSignupComplete={() => {
            setShowFreemiumSignup(false);
            if (onLocationSaved) {
              onLocationSaved();
            }
            setSavedLocationsRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </AppLayout>
  );
}

function App() {
  const [savedLocation, setSavedLocation] = useState<Location | null>(null);
  const [temporaryLocation, setTemporaryLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  // The active location is either saved (persisted) or temporary (guest, in-memory only)
  const activeLocation = savedLocation || temporaryLocation;

  useEffect(() => {
    // Load saved location from localStorage on app startup
    const loadSavedLocation = () => {
      try {
        const saved = localStorage.getItem('savedLocation');
        if (saved) {
          const location: Location = JSON.parse(saved);

          // Clean up invalid station IDs from old deployments
          const invalidStationIds = ['8725354', '8725384', '8725392', '8725405', '8725412',
                                     '8725435', '8725437', '8725440', '8725447', '8725480', '8725500'];

          if (location.tideStationId && invalidStationIds.includes(location.tideStationId)) {
            console.warn(`Removing invalid tide station ${location.tideStationId} from saved location`);
            delete location.tideStationId;
            localStorage.setItem('savedLocation', JSON.stringify(location));
          }

          setSavedLocation(location);
        }
      } catch (error) {
        console.error('Error loading saved location:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLocation();
  }, []);

  const handleLocationSelect = (location: Location, promptSave: boolean = false) => {
    if (promptSave) {
      // Logged-in trial/paid user: save to localStorage and prompt to save to DB
      localStorage.setItem('savedLocation', JSON.stringify(location));
      setSavedLocation(location);
      setShowSavePrompt(true);
    } else {
      // Guest or free user selecting from map: use temporary location
      // Don't persist to localStorage — they need to sign up to save
      // The FreemiumSignupModal will auto-show via the isTemporaryLocation effect
      setTemporaryLocation(location);
    }
  };

  const handleLocationSaved = () => {
    // Called after a guest signs up and their temporary location is saved
    // Promote temporary location to saved location
    if (temporaryLocation) {
      localStorage.setItem('savedLocation', JSON.stringify(temporaryLocation));
      setSavedLocation(temporaryLocation);
      setTemporaryLocation(null);
    }
  };

  const handleLocationChange = () => {
    // Allow user to change location by returning to map
    setSavedLocation(null);
    setTemporaryLocation(null);
  };

  const handleLocationUpdate = () => {
    // Reload the saved location from localStorage
    try {
      const saved = localStorage.getItem('savedLocation');
      if (saved) {
        const location: Location = JSON.parse(saved);
        setSavedLocation(location);
      }
    } catch (error) {
      console.error('Error reloading saved location:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            activeLocation ? (
              <Navigate to="/forecast" replace />
            ) : (
              <MapView onLocationSelect={handleLocationSelect} />
            )
          }
        />
        <Route
          path="/forecast"
          element={
            activeLocation ? (
              <ForecastViewWithLayout
                location={activeLocation}
                onLocationChange={handleLocationChange}
                onLocationUpdate={handleLocationUpdate}
                showSavePromptOnLoad={showSavePrompt}
                onSavePromptHandled={() => setShowSavePrompt(false)}
                isTemporaryLocation={!savedLocation && !!temporaryLocation}
                onLocationSaved={handleLocationSaved}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/wind-map" element={<WindMap location={activeLocation} onLocationChange={handleLocationChange} />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/:slug" element={<ArticlePage />} />
      </Routes>
    </Router>
  );
}

export default App;
