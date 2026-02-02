import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Location } from '../types';
import { getLocationForecast } from '../services/noaaApi';
import WindChart from './WindChart';
import TemperatureChart from './TemperatureChart';
import TideChart from './TideChart';
import WeatherConditionsChart from './WeatherConditionsChart';
import SunMoonTimes from './SunMoonTimes';
import FeedingPeriods from './FeedingPeriods';
import BarometricPressure from './BarometricPressure';
import DaySelector from './DaySelector';
import TideStationSelector from './TideStationSelector';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';
import UpgradeModal from './UpgradeModal';
import { useMobileMenu } from './AppLayout';
import { getSolunarData } from '../utils/solunarData';

interface ForecastViewProps {
  location: Location;
  onLocationChange: () => void;
  onLocationUpdate?: () => void;
  showStationSelector?: boolean;
  onCloseStationSelector?: () => void;
  showAuthModal?: boolean;
  onCloseAuthModal?: () => void;
  showUpgradeModal?: boolean;
  onCloseUpgradeModal?: () => void;
  onOpenAuthModal?: () => void;
  onOpenUpgradeModal?: () => void;
}

interface ForecastData {
  wind: any[];
  temperature: any[];
  weather: any[];
  pressure: { timestamp: string; pressure: number }[];
  tides: any[];
  tideStation?: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    distance: number;
  };
  waterTemperature?: number | null;
}

function ForecastView({
  location,
  onLocationChange: _onLocationChange,
  onLocationUpdate,
  showStationSelector: showStationSelectorProp,
  onCloseStationSelector,
  showAuthModal: showAuthModalProp,
  onCloseAuthModal,
  showUpgradeModal: showUpgradeModalProp,
  onCloseUpgradeModal,
  onOpenAuthModal,
  onOpenUpgradeModal
}: ForecastViewProps) {
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | undefined>(location.tideStationId);

  // Use props if provided (from AppLayout), otherwise fall back to internal state
  const [internalShowStation, setInternalShowStation] = useState(false);
  const [internalShowAuth, setInternalShowAuth] = useState(false);
  const [internalShowUpgrade, setInternalShowUpgrade] = useState(false);
  const [upgradeFeatureDescription, setUpgradeFeatureDescription] = useState('Access extended 7-day forecasts');

  const showStationSelector = showStationSelectorProp ?? internalShowStation;
  const showAuthModal = showAuthModalProp ?? internalShowAuth;
  const showUpgradeModal = showUpgradeModalProp ?? internalShowUpgrade;

  const closeStationSelector = onCloseStationSelector ?? (() => setInternalShowStation(false));
  const closeAuthModal = onCloseAuthModal ?? (() => setInternalShowAuth(false));
  const closeUpgradeModal = onCloseUpgradeModal ?? (() => setInternalShowUpgrade(false));
  const openAuthModal = onOpenAuthModal ?? (() => setInternalShowAuth(true));
  const openUpgradeModal = onOpenUpgradeModal ?? (() => setInternalShowUpgrade(true));

  useEffect(() => {
    setSelectedDay(new Date());
    setSelectedStationId(location.tideStationId);
  }, [location.latitude, location.longitude, location.tideStationId]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getLocationForecast(location, selectedStationId);
        setForecastData(data);
      } catch (err) {
        console.error('Error fetching forecast data:', err);
        setError('Failed to load forecast data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [location, selectedStationId]);

  const handleStationSelect = (stationId: string) => {
    setSelectedStationId(stationId);

    // Update location in localStorage with new tide station
    const updatedLocation = {
      ...location,
      tideStationId: stationId
    };
    localStorage.setItem('savedLocation', JSON.stringify(updatedLocation));

    // Notify parent to reload location
    if (onLocationUpdate) {
      onLocationUpdate();
    }
  };

  const openMobileMenu = useMobileMenu();

  const solunarData = useMemo(
    () => getSolunarData(selectedDay, location.latitude, location.longitude),
    [selectedDay, location.latitude, location.longitude]
  );

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '0.75rem',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="mobile-menu-btn" onClick={openMobileMenu}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 style={{ fontSize: '1.25rem' }}>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {forecastData?.tideStation && (
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ fontSize: '0.8rem' }}>📍</span>
              <span>{forecastData.tideStation.name}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                ({(forecastData.tideStation.distance * 0.621371).toFixed(1)} mi)
              </span>
            </div>
          )}
          <UserMenu
            onOpenAuth={openAuthModal}
            onOpenUpgrade={openUpgradeModal}
          />
        </div>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem'
        }}>
          <div className="spinner" />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Loading marine forecast and tide predictions...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid #F87171',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ marginBottom: '0.5rem', color: '#F87171' }}>Error</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && forecastData && (
        <>
          {/* Day Selector */}
          <DaySelector
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onLockedDayClick={() => {
              setUpgradeFeatureDescription('Access extended 7-day forecasts');
              openUpgradeModal();
            }}
          />

          {/* Charts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1rem'
          }}
          className="charts-grid">
            {/* Wind Chart */}
            {forecastData.wind.length > 0 && (
              <WindChart
                data={forecastData.wind}
                selectedDay={selectedDay}
              />
            )}

            {/* Tide Chart */}
            <TideChart
              data={forecastData.tides}
              selectedDay={selectedDay}
              stationName={forecastData.tideStation?.name}
              waterTemperature={forecastData.waterTemperature}
            />

            {/* Temperature Chart */}
            {forecastData.temperature.length > 0 && (
              <TemperatureChart
                data={forecastData.temperature}
                weatherData={forecastData.weather}
                selectedDay={selectedDay}
              />
            )}

            {/* Weather Conditions Chart */}
            {forecastData.weather.length > 0 && (
              <WeatherConditionsChart
                data={forecastData.weather}
                selectedDay={selectedDay}
              />
            )}

            {/* Sun & Moon Times */}
            <SunMoonTimes
              data={solunarData}
              weatherData={forecastData.weather}
              selectedDay={selectedDay}
            />

            {/* Feeding Periods */}
            <FeedingPeriods
              data={solunarData}
            />

            {/* Barometric Pressure */}
            <BarometricPressure
              pressureData={forecastData.pressure}
              selectedDay={selectedDay}
            />
          </div>

          {/* Marine Forecast Info */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginTop: '1rem',
            border: '1px solid var(--color-border)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.6',
              margin: 0
            }}>
              Just the marine forecast data you need to plan a great day on the water.{' '}
              <Link to="/learn" style={{ color: 'var(--color-accent)' }}>
                Learn
              </Link>
            </p>
          </div>
        </>
      )}

      {/* Tide Station Selector Modal */}
      {showStationSelector && (
        <TideStationSelector
          userLat={location.latitude}
          userLng={location.longitude}
          currentStationId={selectedStationId}
          onSelect={handleStationSelect}
          onClose={closeStationSelector}
          onUpgrade={() => {
            closeStationSelector();
            openAuthModal();
          }}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={closeAuthModal}
          initialMode="signup"
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={closeUpgradeModal}
          onOpenAuth={() => {
            closeUpgradeModal();
            openAuthModal();
          }}
          featureDescription={upgradeFeatureDescription}
        />
      )}
    </div>
  );
}

export default ForecastView;
