import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserMenuProps {
  onOpenAuth: () => void;
  onOpenUpgrade: () => void;
}

export default function UserMenu({ onOpenAuth, onOpenUpgrade }: UserMenuProps) {
  const { user, profile, tier, daysRemaining, signOut, isConfigured } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Don't show anything if auth is not configured
  if (!isConfigured) {
    return null;
  }

  // Show sign in button when not logged in
  if (!user) {
    return (
      <button
        onClick={onOpenAuth}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--color-accent)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.875rem',
          transition: 'background-color 0.15s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4a9eff'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
      >
        Sign In
      </button>
    );
  }

  const handleManageSubscription = async () => {
    setIsOpen(false);
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          returnUrl: window.location.href
        })
      });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (error) {
      console.error('Error opening billing portal:', error);
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const getTierBadge = () => {
    switch (tier) {
      case 'trial':
        return {
          label: `Trial (${daysRemaining}d)`,
          color: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.15)'
        };
      case 'paid':
        return {
          label: 'Pro',
          color: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.15)'
        };
      default:
        return {
          label: 'Free',
          color: 'var(--color-text-secondary)',
          bgColor: 'var(--color-background)'
        };
    }
  };

  const badge = getTierBadge();
  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName[0]?.toUpperCase() || 'U';

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.625rem',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          color: 'var(--color-text)',
          transition: 'border-color 0.15s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-text-secondary)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            style={{ width: 28, height: 28, borderRadius: '50%' }}
          />
        ) : (
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.8125rem'
          }}>
            {avatarLetter}
          </div>
        )}
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '0.125rem 0.5rem',
            borderRadius: '4px',
            backgroundColor: badge.bgColor,
            color: badge.color
          }}
        >
          {badge.label}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease'
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 0.5rem)',
          right: 0,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          minWidth: '220px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          zIndex: 100,
          overflow: 'hidden'
        }}>
          {/* User info header */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background)'
          }}>
            <div style={{ fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              {profile?.email}
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: '0.5rem 0' }}>
            {tier !== 'paid' && (
              <button
                onClick={() => { setIsOpen(false); onOpenUpgrade(); }}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--color-accent)',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-background)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Upgrade to Pro
              </button>
            )}

            {tier === 'paid' && (
              <button
                onClick={handleManageSubscription}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--color-text)',
                  fontSize: '0.9375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-background)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Manage Subscription
              </button>
            )}
          </div>

          {/* Sign out */}
          <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.5rem 0' }}>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                fontSize: '0.9375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-background)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
