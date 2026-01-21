import { useState, useEffect } from 'react';
import { Location } from '../types';
import { getLocationForecast } from '../services/noaaApi';
import WindChart from './WindChart';
import TemperatureChart from './TemperatureChart';
import TideChart from './TideChart';
import WeatherConditionsChart from './WeatherConditionsChart';
import DaySelector from './DaySelector';
import LocationThumbnail from './LocationThumbnail';

interface ForecastViewProps {
  location: Location;
  onLocationChange: () => void;
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

function ForecastView({ location, onLocationChange }: ForecastViewProps) {
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getLocationForecast(location);
        setForecastData(data);
      } catch (err) {
        console.error('Error fetching forecast data:', err);
        setError('Failed to load forecast data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [location]);

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
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1>Tides & Weather</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <LocationThumbnail
            latitude={location.latitude}
            longitude={location.longitude}
            onClick={onLocationChange}
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
            Loading forecast data...
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
          </div>

          {/* Station info */}
          {forecastData.tideStation && (
            <div style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              marginTop: '1.5rem'
            }}>
              Tide data from {forecastData.tideStation.name}
              ({forecastData.tideStation.distance.toFixed(1)} km away)
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ForecastView;
