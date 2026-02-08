import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../lib/api';
import './AdminDashboard.css';

interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  tier: 'free' | 'trial' | 'paid';
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  lastSignIn: string | null;
  locationCount: number;
}

interface AdminSummary {
  totalUsers: number;
  freeCount: number;
  trialCount: number;
  paidCount: number;
  signupsToday: number;
  signupsThisWeek: number;
}

interface AdminData {
  summary: AdminSummary;
  users: AdminUser[];
}

type SortField = 'email' | 'tier' | 'status' | 'createdAt' | 'lastSignIn' | 'locationCount';
type SortDir = 'asc' | 'desc';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    document.title = 'Admin Dashboard | My Marine Forecast';
    return () => {
      document.title = 'My Marine Forecast - Tide, Wind & Weather for Boating and Fishing';
    };
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch('/api/admin/users');
      if (res.status === 403) {
        setError('Access denied. You are not an admin.');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Server error (${res.status})`);
        return;
      }
      const json: AdminData = await res.json();
      setData(json);
    } catch (err) {
      setError('Failed to connect to the server.');
      console.error('[AdminDashboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'createdAt' || field === 'lastSignIn' ? 'desc' : 'asc');
    }
  };

  const sortedUsers = useMemo(() => {
    if (!data) return [];
    const sorted = [...data.users];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'email':
          cmp = a.email.localeCompare(b.email);
          break;
        case 'tier': {
          const tierOrder = { paid: 3, trial: 2, free: 1 };
          cmp = (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0);
          break;
        }
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'lastSignIn':
          cmp = (a.lastSignIn ? new Date(a.lastSignIn).getTime() : 0)
              - (b.lastSignIn ? new Date(b.lastSignIn).getTime() : 0);
          break;
        case 'locationCount':
          cmp = a.locationCount - b.locationCount;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [data, sortField, sortDir]);

  const renderSortHeader = (label: string, field: SortField) => {
    const isActive = sortField === field;
    return (
      <th
        className={isActive ? 'sorted' : ''}
        onClick={() => handleSort(field)}
      >
        {label}
        {isActive && (
          <span className="sort-arrow">
            {sortDir === 'asc' ? '\u25B2' : '\u25BC'}
          </span>
        )}
      </th>
    );
  };

  if (authLoading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header>
        <h1>Admin Dashboard</h1>
        <Link to="/forecast" className="admin-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Forecast
        </Link>
      </header>

      <div className="admin-content">
        {loading && (
          <div className="admin-loading">
            <div className="spinner" />
            <span style={{ color: 'var(--color-text-secondary)' }}>Loading user data...</span>
          </div>
        )}

        {error && (
          <div className="admin-error">
            <span className="error-message">{error}</span>
            <button className="admin-retry-button" onClick={fetchData}>
              Retry
            </button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Summary Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-value">{data.summary.totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-value" style={{ color: '#9ca3af' }}>{data.summary.freeCount}</div>
                <div className="stat-label">Free</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-value" style={{ color: '#eab308' }}>{data.summary.trialCount}</div>
                <div className="stat-label">Trial</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-value" style={{ color: '#22c55e' }}>{data.summary.paidCount}</div>
                <div className="stat-label">Paid</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-value">{data.summary.signupsToday}</div>
                <div className="stat-label">Signups Today</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-value">{data.summary.signupsThisWeek}</div>
                <div className="stat-label">Signups (7d)</div>
              </div>
            </div>

            {/* Users Table */}
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    {renderSortHeader('Email', 'email')}
                    {renderSortHeader('Tier', 'tier')}
                    {renderSortHeader('Status', 'status')}
                    {renderSortHeader('Signed Up', 'createdAt')}
                    {renderSortHeader('Last Sign In', 'lastSignIn')}
                    {renderSortHeader('Locations', 'locationCount')}
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map(u => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>
                        <span className={`tier-badge ${u.tier}`}>{u.tier}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.status}`}>{u.status}</span>
                        {u.cancelAtPeriodEnd && (
                          <span style={{ fontSize: '0.7rem', color: '#f97316', marginLeft: '0.375rem' }}>
                            (canceling)
                          </span>
                        )}
                      </td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td title={u.lastSignIn ? new Date(u.lastSignIn).toLocaleString() : ''}>
                        {formatRelative(u.lastSignIn)}
                      </td>
                      <td>{u.locationCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
