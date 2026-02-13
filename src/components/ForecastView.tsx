import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DndContext, DragOverlay, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Location } from '../types';
import type { MultiModelData } from '../types/multiModel';
import { getLocationForecast } from '../services/noaaApi';
import WindChart from './WindChart';
import WaveChart from './WaveChart';
import TemperatureChart from './TemperatureChart';
import TideChart from './TideChart';
import WeatherConditionsChart from './WeatherConditionsChart';
import SunMoonTimes from './SunMoonTimes';
import FeedingPeriods from './FeedingPeriods';
import BarometricPressure from './BarometricPressure';
import ModelComparisonModal from './ModelComparisonModal';
import AlertBanner from './AlertBanner';
import ForecastSynopsis from './ForecastSynopsis';
import DashboardCard from './DashboardCard';
import DaySelector from './DaySelector';
import TideStationSelector from './TideStationSelector';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';
import UpgradeModal from './UpgradeModal';
import InlineUpgradePrompt from './InlineUpgradePrompt';
import SaveLocationBanner from './SaveLocationBanner';
import { useMobileMenu, useDashboardEditContext } from './AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { getSolunarData } from '../utils/solunarData';
import type { CardId } from '../types/dashboard';

interface ForecastViewProps {
  location: Location;
  onLocationChange: () => void;
  onLocationUpdate?: () => void;
  showStationSelector?: boolean;
  onCloseStationSelector?: () => void;
  showAuthModal?: boolean;
  authModalMode?: 'login' | 'signup';
  onCloseAuthModal?: () => void;
  showUpgradeModal?: boolean;
  onCloseUpgradeModal?: () => void;
  isTemporaryLocation?: boolean;
  onOpenAuthModal?: (mode?: 'login' | 'signup') => void;
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
  waves?: any[];
  alerts?: any[];
  multiModel?: MultiModelData | null;
}

function ForecastView({
  location,
  onLocationChange,
  onLocationUpdate,
  isTemporaryLocation,
  showStationSelector: showStationSelectorProp,
  onCloseStationSelector,
  showAuthModal: showAuthModalProp,
  authModalMode: authModalModeProp,
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
  const [internalAuthMode, setInternalAuthMode] = useState<'login' | 'signup'>('login');
  const [internalShowUpgrade, setInternalShowUpgrade] = useState(false);
  const [upgradeFeatureDescription, setUpgradeFeatureDescription] = useState('Access extended 7-day forecasts');
  const [showDashboardUpsell, setShowDashboardUpsell] = useState(false);
  const [activeDragId, setActiveDragId] = useState<CardId | null>(null);
  const [showModelComparison, setShowModelComparison] = useState(false);
  const [previewTriggeredModal, setPreviewTriggeredModal] = useState(false);
  const [inlinePrompt, setInlinePrompt] = useState<{ feature: string; variant: 'signup' | 'upgrade' } | null>(null);

  // Dashboard customization
  const { user, canCustomizeDashboard, tier } = useAuth();
  const {
    layout,
    isEditMode,
    enterEditMode,
    saveAndExit,
    discardAndExit,
    reorderCards,
  } = useDashboardLayout();

  // Register enterEditMode with sidebar context
  const { register: registerEditMode } = useDashboardEditContext();
  useEffect(() => {
    registerEditMode(enterEditMode);
  }, [registerEditMode, enterEditMode]);

  // Configure dnd-kit sensors with activation constraints to prevent accidental drags
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 100, tolerance: 8 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as CardId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderCards(active.id as CardId, over.id as CardId);
    }
    setActiveDragId(null);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const handleDoneClick = () => {
    if (canCustomizeDashboard) {
      saveAndExit();
    } else {
      // Show upsell prompt for free/trial users
      setShowDashboardUpsell(true);
    }
  };

  const showStationSelector = showStationSelectorProp ?? internalShowStation;
  const showAuthModal = showAuthModalProp ?? internalShowAuth;
  const showUpgradeModal = showUpgradeModalProp ?? internalShowUpgrade;

  const closeStationSelector = onCloseStationSelector ?? (() => setInternalShowStation(false));
  const authModalMode = authModalModeProp ?? internalAuthMode;
  const baseCloseAuth = onCloseAuthModal ?? (() => setInternalShowAuth(false));
  const baseCloseUpgrade = onCloseUpgradeModal ?? (() => setInternalShowUpgrade(false));
  const closeAuthModal = () => {
    baseCloseAuth();
    if (previewTriggeredModal) {
      setShowModelComparison(false);
      setPreviewTriggeredModal(false);
    }
  };
  const closeUpgradeModal = () => {
    baseCloseUpgrade();
    if (previewTriggeredModal) {
      setShowModelComparison(false);
      setPreviewTriggeredModal(false);
    }
  };
  const openAuthModal = onOpenAuthModal ?? ((mode?: 'login' | 'signup') => { setInternalAuthMode(mode ?? 'signup'); setInternalShowAuth(true); });
  const openUpgradeModal = onOpenUpgradeModal ?? (() => setInternalShowUpgrade(true));

  const handleCompareModels = () => {
    setShowModelComparison(true);
  };

  useEffect(() => {
    setSelectedDay(new Date());
    setSelectedStationId(location.tideStationId);
  }, [location.latitude, location.longitude, location.tideStationId]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getLocationForecast(location, selectedStationId, { includeMultiModel: true });
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

  const handleStationSelect = (stationId: string, stationName: string) => {
    setSelectedStationId(stationId);

    // Update location in localStorage with new tide station
    const updatedLocation = {
      ...location,
      tideStationId: stationId,
      name: stationName
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
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '0.75rem',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
          <button className="mobile-menu-btn" onClick={openMobileMenu}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {!isEditMode && (
            <button
              onClick={() => {
                if (canCustomizeDashboard) {
                  enterEditMode();
                } else {
                  setInlinePrompt({
                    feature: 'Custom dashboard layout',
                    variant: user ? 'upgrade' : 'signup',
                  });
                }
              }}
              title="Customize Dashboard"
              style={{
                background: 'none',
                border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius-md)',
                padding: '0.35rem 0.6rem',
                cursor: 'pointer',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-accent)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--color-accent)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Customize Dashboard</span>
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <UserMenu
            onOpenAuth={() => openAuthModal('login')}
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
          {/* Location Map + Day Selector Row */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {/* Location Thumbnail */}
            <button
              onClick={onLocationChange}
              style={{
                flexShrink: 0,
                width: '70px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                padding: '0.35rem 0.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
              title={forecastData.tideStation ? `${forecastData.tideStation.name} - Click to change location` : 'Click to change location'}
            >
              {/* Map pin icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="var(--color-accent)"
                stroke="none"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {/* Station name truncated */}
              <span style={{
                fontSize: '0.5rem',
                color: 'var(--color-text-primary)',
                textAlign: 'center',
                lineHeight: 1.1,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                padding: '0 0.1rem',
              }}>
                {forecastData.tideStation?.name?.split(' ').slice(0, 2).join(' ') || 'Location'}
              </span>
              <span style={{
                fontSize: '0.5rem',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}>
                Change
              </span>
            </button>

            {/* Day Selector */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <DaySelector
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                onLockedDayClick={() => {
                  setInlinePrompt({
                    feature: 'Extended 7-day forecasts',
                    variant: user ? 'upgrade' : 'signup',
                  });
                }}
              />
            </div>
          </div>

          {/* Inline upgrade prompt — shown at gate points */}
          {inlinePrompt && (
            <InlineUpgradePrompt
              featureDescription={inlinePrompt.feature}
              variant={inlinePrompt.variant}
              onSignup={() => {
                setInlinePrompt(null);
                openAuthModal();
              }}
              onUpgrade={() => {
                setInlinePrompt(null);
                setUpgradeFeatureDescription(inlinePrompt.feature);
                openUpgradeModal();
              }}
              onDismiss={() => setInlinePrompt(null)}
            />
          )}

          {/* Edit mode header bar */}
          {isEditMode && (
            <>
              <div className="dashboard-edit-bar">
                <span className="dashboard-edit-bar__label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editing Dashboard
                </span>
              </div>
              <button className="dashboard-save-btn" onClick={handleDoneClick}>Save</button>
            </>
          )}

          {/* Marine Alerts Banner */}
          {forecastData.alerts && forecastData.alerts.length > 0 && (
            <AlertBanner alerts={forecastData.alerts} selectedDay={selectedDay} />
          )}

          {/* Weather Synopsis Banner */}
          <ForecastSynopsis
            wind={forecastData.wind}
            waves={forecastData.waves}
            weather={forecastData.weather}
            multiModel={forecastData.multiModel ?? null}
            selectedDay={selectedDay}
            onCompareModels={handleCompareModels}
          />

          {/* Save Location Banner — shown to anonymous guests */}
          {isTemporaryLocation && !user && (
            <SaveLocationBanner
              locationName={location.name || 'this location'}
              onSignup={openAuthModal}
            />
          )}

          {/* Charts - Sortable Grid */}
          {(() => {
            // Build card availability map
            const cardAvailability: Record<CardId, boolean> = {
              wind: forecastData.wind.length > 0,
              waves: (forecastData.waves?.length ?? 0) > 0,
              tide: true,
              temperature: forecastData.temperature.length > 0,
              weather: forecastData.weather.length > 0,
              sunmoon: true,
              feeding: true,
              barometric: true,
            };

            // Build card renderer map
            const cardRenderers: Record<CardId, React.ReactNode> = {
              wind: <WindChart data={forecastData.wind} selectedDay={selectedDay} multiModelData={forecastData.multiModel} onCompareModels={handleCompareModels} />,
              waves: <WaveChart data={forecastData.waves || []} selectedDay={selectedDay} multiModelData={forecastData.multiModel} onCompareModels={handleCompareModels} />,
              tide: (
                <TideChart
                  data={forecastData.tides}
                  selectedDay={selectedDay}
                  stationName={forecastData.tideStation?.name}
                  waterTemperature={forecastData.waterTemperature}
                />
              ),
              temperature: (
                <TemperatureChart
                  data={forecastData.temperature}
                  weatherData={forecastData.weather}
                  selectedDay={selectedDay}
                />
              ),
              weather: <WeatherConditionsChart data={forecastData.weather} selectedDay={selectedDay} />,
              sunmoon: (
                <SunMoonTimes
                  data={solunarData}
                  weatherData={forecastData.weather}
                  selectedDay={selectedDay}
                />
              ),
              feeding: <FeedingPeriods data={solunarData} />,
              barometric: <BarometricPressure pressureData={forecastData.pressure} selectedDay={selectedDay} />,
            };

            const visibleCards = layout.cards.filter(c => cardAvailability[c.id]);

            return (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext
                  items={visibleCards.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className="charts-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: '1rem',
                    }}
                  >
                    {visibleCards.map(card => (
                      <DashboardCard
                        key={card.id}
                        id={card.id}
                        title={card.title}
                        isEditMode={isEditMode}
                      >
                        {cardRenderers[card.id]}
                      </DashboardCard>
                    ))}
                  </div>
                </SortableContext>

                {/* Drag overlay — the "lifted" card that follows the cursor */}
                <DragOverlay dropAnimation={{
                  duration: 250,
                  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                }}>
                  {activeDragId ? (
                    <div className="dashboard-card--overlay">
                      {cardRenderers[activeDragId]}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            );
          })()}

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
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={closeAuthModal}
          initialMode={authModalMode}
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

      {/* Model Comparison Modal */}
      {showModelComparison && forecastData?.multiModel && (
        <ModelComparisonModal
          multiModelData={forecastData.multiModel}
          selectedDay={selectedDay}
          onClose={() => setShowModelComparison(false)}
          previewMode={tier === 'free'}
          onUpgrade={() => {
            setPreviewTriggeredModal(true);
            setUpgradeFeatureDescription('Multi-model forecast comparison');
            openUpgradeModal();
          }}
          onSignup={() => {
            setPreviewTriggeredModal(true);
            openAuthModal();
          }}
        />
      )}

      {/* Dashboard Save Upsell */}
      {showDashboardUpsell && (
        <div className="dashboard-upsell-overlay" onClick={() => {
          setShowDashboardUpsell(false);
          discardAndExit();
        }}>
          <div className="dashboard-upsell" onClick={e => e.stopPropagation()}>
            <div className="dashboard-upsell__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div className="dashboard-upsell__title">Save Your Dashboard?</div>
            <div className="dashboard-upsell__description">
              Upgrade to keep your personalized dashboard layout. Your custom card order and preferences will be saved across sessions.
            </div>
            <div className="dashboard-upsell__actions">
              <button
                className="dashboard-upsell__discard"
                onClick={() => {
                  setShowDashboardUpsell(false);
                  discardAndExit();
                }}
              >
                Discard Changes
              </button>
              <button
                className="dashboard-upsell__upgrade"
                onClick={() => {
                  setShowDashboardUpsell(false);
                  discardAndExit();
                  openAuthModal();
                }}
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForecastView;
