import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout as apiLogout } from '../utils/api';

export default function SettingsPage() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState({
    tempUnit: localStorage.getItem('tempUnit') || 'fahrenheit',
    weightUnit: localStorage.getItem('weightUnit') || 'grams',
    defaultRatio: localStorage.getItem('defaultRatio') || '1:17',
    showAdvancedTaste: localStorage.getItem('showAdvancedTaste') === 'true',
    theme: localStorage.getItem('theme') || 'dark',
  });

  const [saved, setSaved] = useState(false);

  function update(field, value) {
    setSettings(s => ({ ...s, [field]: value }));
  }

  function handleSave() {
    localStorage.setItem('tempUnit', settings.tempUnit);
    localStorage.setItem('weightUnit', settings.weightUnit);
    localStorage.setItem('defaultRatio', settings.defaultRatio);
    localStorage.setItem('showAdvancedTaste', settings.showAdvancedTaste);
    localStorage.setItem('theme', settings.theme);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setSettings({
      tempUnit: 'fahrenheit',
      weightUnit: 'grams',
      defaultRatio: '1:17',
      showAdvancedTaste: true,
      theme: 'dark',
    });
  }

  return (
    <div>
      <div className="section-head">
        <span className="section-num">⚙</span>
        <h2 className="section-title">Settings & <em>Preferences</em></h2>
        <div className="section-line" />
      </div>
      <p className="section-sub">
        Customize your brewing experience. These preferences are saved locally in your browser.
      </p>

      <div className="settings-grid">
        <div className="settings-section">
          <h3 className="settings-heading">Measurement Units</h3>
          
          <div className="field-group">
            <label className="field-label">Temperature Unit</label>
            <select
              className="field-select"
              value={settings.tempUnit}
              onChange={e => update('tempUnit', e.target.value)}
            >
              <option value="fahrenheit">Fahrenheit (°F)</option>
              <option value="celsius">Celsius (°C)</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Weight Unit</label>
            <select
              className="field-select"
              value={settings.weightUnit}
              onChange={e => update('weightUnit', e.target.value)}
            >
              <option value="grams">Grams (g)</option>
              <option value="ounces">Ounces (oz)</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-heading">Brew Preferences</h3>
          
          <div className="field-group">
            <label className="field-label">Default Brew Ratio</label>
            <select
              className="field-select"
              value={settings.defaultRatio}
              onChange={e => update('defaultRatio', e.target.value)}
            >
              <option value="1:16">1:16 (Espresso-style)</option>
              <option value="1:17">1:17 (Standard)</option>
              <option value="1:18">1:18 (Pour over)</option>
              <option value="1:20">1:20 (Immersion)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Show Advanced Taste Profile</label>
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="advancedTaste"
                checked={settings.showAdvancedTaste}
                onChange={e => update('showAdvancedTaste', e.target.checked)}
              />
              <label htmlFor="advancedTaste">
                Display Body, Complexity, Aftertaste, and Smoothness sliders
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-heading">Appearance</h3>
          
          <div className="field-group">
            <label className="field-label">Theme</label>
            <select
              className="field-select"
              value={settings.theme}
              onChange={e => update('theme', e.target.value)}
            >
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
        </div>
      </div>

      {saved && (
        <div className="settings-message">
          ✓ Settings saved successfully
        </div>
      )}

      <div className="submit-row">
        <button type="button" className="btn btn-secondary" onClick={handleReset}>
          Reset to defaults
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          Save preferences →
        </button>
      </div>

      <div className="settings-signout">
        <button
          type="button"
          className="btn btn-signout"
          onClick={async () => {
            const rt = localStorage.getItem('refreshToken');
            if (rt) await apiLogout(rt).catch(() => {});
            logout();
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
