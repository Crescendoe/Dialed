import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import BrewForm from './components/BrewForm';
import BrewTable from './components/BrewTable';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SettingsPage from './components/SettingsPage';
import { useLookups, useBrews } from './hooks/useBrewData';
import { logout as apiLogout } from './utils/api';

const TABS = [
  { id: 'log',       label: 'Log brew' },
  { id: 'history',   label: 'Brew log' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings',  label: 'Settings' },
];

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
        Couldn't reach API · check the backend is running
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
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" />
          <div className="brand-name">Brew <em>Tracker</em></div>
          <div className="brand-tag">Est. 2026 · OKC</div>
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
      </main>

      <footer className="app-footer">
        <div className="footer-meta">
          <span>v0.1.0</span>
          <span>React · .NET 8 · SQL Server</span>
        </div>
        <div className="footer-meta">
          <span>github.com/Crescendoe/Brew-Tracker</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
