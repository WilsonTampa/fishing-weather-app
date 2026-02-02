import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MapView from './components/MapView';
import ForecastView from './components/ForecastView';
import AppLayout from './components/AppLayout';
import SaveLocationModal from './components/SaveLocationModal';
import LearnPage from './components/LearnPage';
import ArticlePage from './components/ArticlePage';
import WindMap from './components/WindMap';
import { Location } from './types';
import './styles/global.css';

function ForecastViewWithLayout({ location, onLocationChange, onLocationUpdate }: {
  location: Location;
  onLocationChange: () => void;
  onLocationUpdate?: () => void;
}) {
  const [showStationSelector, setShowStationSelector] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSaveLocationModal, setShowSaveLocationModal] = useState(false);
  const [savedLocationsRefreshKey, setSavedLocationsRefreshKey] = useState(0);

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

      {/* Save Location Modal */}
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
    </AppLayout>
  );
}

function App() {
  const [savedLocation, setSavedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved location from localStorage on app startup
    const loadSavedLocation = () => {
      try {
        const saved = localStorage.getItem('savedLocation');
        if (saved) {
          const location: Location = JSON.parse(saved);

          // Clean up invalid station IDs from old deployments
          // Station 8725354 was incorrectly added and should be 8725441
          const invalidStationIds = ['8725354', '8725384', '8725392', '8725405', '8725412',
                                     '8725435', '8725437', '8725440', '8725447', '8725480', '8725500'];

          if (location.tideStationId && invalidStationIds.includes(location.tideStationId)) {
            console.warn(`Removing invalid tide station ${location.tideStationId} from saved location`);
            // Remove the invalid station ID, will auto-select nearest on next load
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

  const handleLocationSelect = (location: Location) => {
    // Save location to localStorage
    localStorage.setItem('savedLocation', JSON.stringify(location));
    setSavedLocation(location);
  };

  const handleLocationChange = () => {
    // Allow user to change location by returning to map
    setSavedLocation(null);
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
            savedLocation ? (
              <Navigate to="/forecast" replace />
            ) : (
              <MapView onLocationSelect={handleLocationSelect} />
            )
          }
        />
        <Route
          path="/forecast"
          element={
            savedLocation ? (
              <ForecastViewWithLayout
                location={savedLocation}
                onLocationChange={handleLocationChange}
                onLocationUpdate={handleLocationUpdate}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/wind-map" element={<WindMap location={savedLocation} onLocationChange={handleLocationChange} />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/:slug" element={<ArticlePage />} />
      </Routes>
    </Router>
  );
}

export default App;
