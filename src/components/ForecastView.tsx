import { useState, useEffect } from 'react';
import { Location } from '../types';
import { getLocationForecast } from '../services/noaaApi';
import WindChart from './WindChart';
import TemperatureChart from './TemperatureChart';
import TideChart from './TideChart';
import WeatherConditionsChart from './WeatherConditionsChart';
import SunMoonTimes from './SunMoonTimes';
import FeedingPeriods from './FeedingPeriods';
import DaySelector from './DaySelector';
import TideStationSelector from './TideStationSelector';
import { getSolunarData } from '../utils/solunarData';

interface ForecastViewProps {
  location: Location;
  onLocationChange: () => void;
  onLocationUpdate?: () => void;
}

interface ForecastData {
  wind: any[];
  temperature: any[];
  weather: any[];
  tides: any[];
  tideStation?: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    distance: number;
  };
}

function ForecastView({ location, onLocationChange, onLocationUpdate }: ForecastViewProps) {
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStationSelector, setShowStationSelector] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | undefined>(location.tideStationId);

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

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1>My Marine Forecast</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem', minWidth: '200px' }}>
          <button
            onClick={onLocationChange}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
              e.currentTarget.style.borderColor = 'var(--color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            Change Location
          </button>
          {forecastData?.tideStation && (
            <>
              <button
                onClick={() => setShowStationSelector(true)}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                Change Tide Station
              </button>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                paddingTop: '0.25rem'
              }}>
                <span style={{ fontSize: '0.8rem' }}>📍</span>
                <span>{forecastData.tideStation.name}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  ({(forecastData.tideStation.distance * 0.621371).toFixed(1)} miles)
                </span>
              </div>
            </>
          )}
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
              data={getSolunarData(selectedDay, location.latitude, location.longitude)}
              weatherData={forecastData.weather}
              selectedDay={selectedDay}
            />

            {/* Feeding Periods */}
            <FeedingPeriods
              data={getSolunarData(selectedDay, location.latitude, location.longitude)}
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
              Just the marine forecast data you need to plan a great day on the water.
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
          onClose={() => setShowStationSelector(false)}
        />
      )}
    </div>
  );
}

export default ForecastView;
