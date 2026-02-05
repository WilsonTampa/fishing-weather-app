import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SavedLocationsPanel from './SavedLocationsPanel';
import './AppLayout.css';

// Context to allow ForecastView header to trigger mobile menu
const MobileMenuContext = createContext<() => void>(() => {});

export function useMobileMenu() {
  return useContext(MobileMenuContext);
}

// Context to allow sidebar to trigger dashboard edit mode
const DashboardEditContext = createContext<{ enter: () => void; register: (fn: () => void) => void }>({
  enter: () => {},
  register: () => {},
});

export function useDashboardEditContext() {
  return useContext(DashboardEditContext);
}

function SubscriptionEndingBanner() {
  const { isSubscriptionEnding, subscriptionEndDate } = useAuth();
  if (!isSubscriptionEnding || !subscriptionEndDate) return null;

  const formattedDate = subscriptionEndDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="sidebar-ending-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>Subscription ends {formattedDate}</span>
    </div>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  onLocationChange: () => void;
  onOpenStationSelector: () => void;
  onOpenAuth: () => void;
  onOpenUpgrade: () => void;
  onSaveLocation: () => void;
  onSelectSavedLocation: (lat: number, lng: number, tideStationId: string | null, name: string) => void;
  savedLocationsRefreshKey: number;
}

export default function AppLayout({
  children,
  onLocationChange,
  onOpenStationSelector: _onOpenStationSelector,
  onOpenAuth,
  onOpenUpgrade,
  onSaveLocation: _onSaveLocation,
  onSelectSavedLocation,
  savedLocationsRefreshKey,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [savedLocationsOpen, setSavedLocationsOpen] = useState(false);
  const { user, tier, daysRemaining, isConfigured, isEmailVerified } = useAuth();

  // Dashboard edit mode bridge
  const enterEditRef = useRef<() => void>(() => {});
  const register = useCallback((fn: () => void) => { enterEditRef.current = fn; }, []);
  const enter = useCallback(() => { enterEditRef.current(); }, []);
  const dashboardEditValue = useMemo(() => ({ enter, register }), [enter, register]);

  // Close sidebar on route change or resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (action: () => void) => {
    action();
    setMobileOpen(false);
  };

  const { signOut } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);

  const handleAccountClick = () => {
    if (!isConfigured) return;
    if (!user) {
      onOpenAuth();
      setMobileOpen(false);
    } else {
      // Toggle account section for logged-in users
      setAccountOpen(prev => !prev);
    }
  };

  const handleSignOut = async () => {
    setMobileOpen(false);
    setAccountOpen(false);
    await signOut();
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-top">My Marine</span>
            <span className="sidebar-logo-bottom">Forecast</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="sidebar-nav-item active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </button>

          <button
            className="sidebar-nav-item"
            onClick={() => handleNavClick(onLocationChange)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Change Location
          </button>

          {/* Saved Locations - collapsible */}
          <button
            className="sidebar-nav-item"
            onClick={() => setSavedLocationsOpen(prev => !prev)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Saved Locations
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                marginLeft: 'auto',
                transition: 'transform 0.2s ease',
                transform: savedLocationsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {savedLocationsOpen && (
            <SavedLocationsPanel
              onSelectLocation={(lat, lng, stationId, name) => {
                onSelectSavedLocation(lat, lng, stationId, name);
                setMobileOpen(false);
              }}
              onOpenAuth={() => handleNavClick(onOpenAuth)}
              onOpenUpgrade={() => handleNavClick(onOpenUpgrade)}
              refreshKey={savedLocationsRefreshKey}
            />
          )}

          {/* Email verification banner for logged-in unverified users */}
          {user && !isEmailVerified && (
            <div className="sidebar-verify-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Verify your email</span>
            </div>
          )}

          {/* Subscription ending banner */}
          {user && tier === 'paid' && (
            <SubscriptionEndingBanner />
          )}

          {!user ? (
            /* Guest: Create Free Account CTA */
            <button
              className="sidebar-nav-item sidebar-nav-cta"
              onClick={handleAccountClick}
              disabled={!isConfigured}
              style={{ opacity: isConfigured ? 1 : 0.5 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Create Free Account
            </button>
          ) : (
            /* Logged-in: Account section with collapsible sub-items */
            <>
              <button
                className="sidebar-nav-item"
                onClick={handleAccountClick}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Account
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    marginLeft: 'auto',
                    transition: 'transform 0.2s ease',
                    transform: accountOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {accountOpen && (
                <div className="sidebar-account-submenu">
                  {tier === 'trial' && daysRemaining !== null && (
                    <div className="sidebar-trial-banner">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left in Trial</span>
                    </div>
                  )}
                  {tier === 'free' && (
                    <button
                      className="sidebar-submenu-item sidebar-submenu-upgrade"
                      onClick={() => { onOpenUpgrade(); setMobileOpen(false); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      Upgrade
                    </button>
                  )}
                  <button
                    className="sidebar-submenu-item"
                    onClick={handleSignOut}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="app-main">
        {/* Expose mobile menu toggle to children via a button in header */}
        <MobileMenuContext.Provider value={() => setMobileOpen(true)}>
          <DashboardEditContext.Provider value={dashboardEditValue}>
            {children}
          </DashboardEditContext.Provider>
        </MobileMenuContext.Provider>
      </main>
    </div>
  );
}
