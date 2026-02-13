import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MapView from './components/MapView';
import ForecastView from './components/ForecastView';
import AppLayout from './components/AppLayout';
import SaveLocationModal from './components/SaveLocationModal';
import SaveLocationPrompt from './components/SaveLocationPrompt';
import LearnPage from './components/LearnPage';
import ArticlePage from './components/ArticlePage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import WindMap from './components/WindMap';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './components/AdminDashboard';
import { Location } from './types';
import { useAuth } from './contexts/AuthContext';
import { fetchSavedLocations } from './services/savedLocations';
import './styles/global.css';

function ForecastViewWithLayout({ location, onLocationChange, onLocationUpdate, showSavePromptOnLoad, onSavePromptHandled, isTemporaryLocation }: {
  location: Location;
  onLocationChange: () => void;
  onLocationUpdate?: () => void;
  showSavePromptOnLoad?: boolean;
  onSavePromptHandled?: () => void;
  isTemporaryLocation?: boolean;
}) {
  const [showStationSelector, setShowStationSelector] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSaveLocationModal, setShowSaveLocationModal] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
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
      onOpenAuth={() => { setAuthModalMode('signup'); setShowAuthModal(true); }}
      onOpenUpgrade={() => setShowUpgradeModal(true)}
      onSaveLocation={() => setShowSaveLocationModal(true)}
      onSelectSavedLocation={handleSelectSavedLocation}
      savedLocationsRefreshKey={savedLocationsRefreshKey}
    >
      <ForecastView
        location={location}
        onLocationChange={onLocationChange}
        onLocationUpdate={onLocationUpdate}
        isTemporaryLocation={isTemporaryLocation}
        showStationSelector={showStationSelector}
        onCloseStationSelector={() => setShowStationSelector(false)}
        showAuthModal={showAuthModal}
        authModalMode={authModalMode}
        onCloseAuthModal={() => setShowAuthModal(false)}
        showUpgradeModal={showUpgradeModal}
        onCloseUpgradeModal={() => setShowUpgradeModal(false)}
        onOpenAuthModal={(mode?: 'login' | 'signup') => { setAuthModalMode(mode ?? 'signup'); setShowAuthModal(true); }}
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
          onOpenAuth={() => { setShowSaveLocationModal(false); setAuthModalMode('signup'); setShowAuthModal(true); }}
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

    </AppLayout>
  );
}

function App() {
  const { user } = useAuth();
  const [savedLocation, setSavedLocation] = useState<Location | null>(null);
  const [temporaryLocation, setTemporaryLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showMap, setShowMap] = useState(false);

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
        } else {
          // No saved location — check for a guest location
          const guest = localStorage.getItem('guestLocation');
          if (guest) {
            const guestLocation: Location = JSON.parse(guest);
            setTemporaryLocation(guestLocation);
          }
        }
      } catch (error) {
        console.error('Error loading saved location:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLocation();
  }, []);

  const handleLocationSelect = async (location: Location, promptSave: boolean = false) => {
    setShowMap(false);
    if (promptSave) {
      // Logged-in trial/paid user: save to localStorage and prompt to save to DB
      localStorage.setItem('savedLocation', JSON.stringify(location));
      setSavedLocation(location);

      // Don't prompt to save if this location is already in the user's saved locations
      let alreadySaved = false;
      if (user && location.tideStationId) {
        try {
          const existing = await fetchSavedLocations(user.id);
          alreadySaved = existing.some(loc => loc.tide_station_id === location.tideStationId);
        } catch {
          // If check fails, default to showing the prompt
        }
      }

      if (!alreadySaved) {
        setShowSavePrompt(true);
      }
    } else {
      // Guest or free user selecting from map: use temporary location
      // Persist to localStorage so they don't lose it on refresh
      localStorage.setItem('guestLocation', JSON.stringify(location));
      setTemporaryLocation(location);
    }
  };

  // When a guest signs in (e.g. via Google OAuth redirect), promote their guest location
  useEffect(() => {
    if (user && !savedLocation) {
      const guest = localStorage.getItem('guestLocation');
      if (guest) {
        try {
          const guestLocation: Location = JSON.parse(guest);
          localStorage.setItem('savedLocation', JSON.stringify(guestLocation));
          localStorage.removeItem('guestLocation');
          setSavedLocation(guestLocation);
          setTemporaryLocation(null);
        } catch {
          localStorage.removeItem('guestLocation');
        }
      }
    }
  }, [user, savedLocation]);

  const handleLocationChange = () => {
    // Show the map so user can pick a new location
    // Keep the current location so they can cancel and go back
    setShowMap(true);
  };

  const handleMapCancel = () => {
    // User cancelled location change — go back to their current dashboard
    setShowMap(false);
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
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/"
          element={
            activeLocation && !showMap ? (
              <Navigate to="/forecast" replace />
            ) : (
              <MapView onLocationSelect={handleLocationSelect} onCancel={activeLocation ? handleMapCancel : undefined} />
            )
          }
        />
        <Route
          path="/forecast"
          element={
            activeLocation && !showMap ? (
              <ForecastViewWithLayout
                location={activeLocation}
                onLocationChange={handleLocationChange}
                onLocationUpdate={handleLocationUpdate}
                showSavePromptOnLoad={showSavePrompt}
                onSavePromptHandled={() => setShowSavePrompt(false)}
                isTemporaryLocation={!savedLocation && !!temporaryLocation}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/wind-map" element={<WindMap location={activeLocation} onLocationChange={handleLocationChange} />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/:slug" element={<ArticlePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
    </Router>
  );
}

export default App;
