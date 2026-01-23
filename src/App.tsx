import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MapView from './components/MapView';
import ForecastView from './components/ForecastView';
import { Location } from './types';
import './styles/global.css';

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
              <ForecastView
                location={savedLocation}
                onLocationChange={handleLocationChange}
                onLocationUpdate={handleLocationUpdate}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
