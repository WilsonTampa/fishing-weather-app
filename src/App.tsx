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
