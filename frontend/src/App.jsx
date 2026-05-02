import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import AuthForm from './components/AuthForm';
import BrewForm from './components/BrewForm';
import BrewTable from './components/BrewTable';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SettingsPage from './components/SettingsPage';
import BrewLogo from './components/BrewLogo';
import { useLookups, useBrews } from './hooks/useBrewData';
import { logout as apiLogout } from './utils/api';

const TABS = [
  { id: 'log',       label: 'Log brew',   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
  { id: 'history',   label: 'Brew log',   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="8" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="18" x2="20" y2="18"/><circle cx="3.5" cy="6" r="1.25" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.25" fill="currentColor" stroke="none"/></svg> },
  { id: 'analytics', label: 'Analytics',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="6" y1="20" x2="6" y2="14"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="10"/></svg> },
  { id: 'settings',  label: 'Settings',   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

const SIGNOUT_ICON = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

function AppInner() {
  const { token, user, logout } = useAuth();
  const [tab, setTab] = useState('log');
  const { origins, methods, loading: lookupsLoading, error: lookupsError } = useLookups();
  const { brews, loading: brewsLoading, error: brewsError, refresh } = useBrews({});

  if (!token) return <AuthForm />;

  if (lookupsLoading) return <div className="app-loading">Loading…</div>;
  if (lookupsError) {
    return (
      <div className="app-loading" style={{ color: '#a85a3c' }}>
        Couldn't reach API · check the backend is running or refresh the page
      </div>
    );
  }

  async function handleLogout() {
    const rt = localStorage.getItem('refreshToken');
    if (rt) await apiLogout(rt).catch(() => {});
    logout();
  }

  return (
    <div className="app">
      {/* Desktop header — nav stays here on large screens */}
      <header className="app-header">
        <div className="brand">
          <BrewLogo size={34} />
          <div className="brand-text">
            <div className="brand-name"><span className="brand-word-mono">DIAL</span><em>ed</em></div>
            <div className="brand-tag">Coffee Brew Tracker · Est. 2026</div>
          </div>
        </div>
        <nav className="app-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >{t.label}</button>
          ))}
        </nav>
        <div className="header-meta">
          <div className="header-meta-item">
            <span className={`header-meta-dot ${brewsError ? 'error' : ''}`} />
            {brewsError ? 'API down' : 'API live'}
          </div>
          <div className="header-meta-item">
            {brews.length} {brews.length === 1 ? 'brew' : 'brews'}
          </div>
          <div className="header-meta-item header-email">{user?.email}</div>
          <button className="nav-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="app-main">
        <div key={tab} className="tab-content">
          {tab === 'log' && (
            <BrewForm
              origins={origins}
              methods={methods}
              onSaved={() => { refresh(); setTab('history'); }}
            />
          )}
          {tab === 'history' && (
            brewsLoading
              ? <div className="chart-loading" style={{ padding: '60px 0' }}>Loading brews…</div>
              : <BrewTable brews={brews} methods={methods} onRefresh={refresh} />
          )}
          {tab === 'analytics' && <AnalyticsDashboard methods={methods} />}
          {tab === 'settings' && <SettingsPage />}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-meta">
          <span>v0.2.0</span>
          <span>React · .NET 8 · SQL Server</span>
        </div>

      </footer>

      {/* Mobile bottom nav — outside header so position:fixed works correctly */}
      <nav className="mobile-bottom-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`mobile-nav-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="mobile-nav-icon">{t.icon}</span>
            <span className="mobile-nav-label">{t.label}</span>
          </button>
        ))}
        <button className="mobile-nav-btn" onClick={handleLogout}>
          <span className="mobile-nav-icon">{SIGNOUT_ICON}</span>
          <span className="mobile-nav-label">Sign out</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppInner />
      </SettingsProvider>
    </AuthProvider>
  );
}
