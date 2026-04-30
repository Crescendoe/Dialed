import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { logout as apiLogout } from '../utils/api';

export default function SettingsPage() {
  const { logout }                       = useAuth();
  const { settings, saveSettings, resetSettings } = useSettings();

  const [local, setLocal] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  function update(field, value) {
    setLocal(s => ({ ...s, [field]: value }));
  }

  function handleSave() {
    saveSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    resetSettings();
    setLocal({
      tempUnit:          'fahrenheit',
      weightUnit:        'grams',
      defaultRatio:      '1:17',
      showAdvancedTaste: false,
    });
  }

  return (
    <div>
      <div className="section-head">
        <span className="section-num">04</span>
        <h2 className="section-title">Settings & <em>Preferences</em></h2>
        <div className="section-line" />
      </div>
      <p className="section-sub">
        Customize your brewing experience. Changes apply immediately after saving.
      </p>

      <div className="settings-grid">
        <div className="settings-section">
          <h3 className="settings-heading">Measurement Units</h3>

          <div className="field-group">
            <label className="field-label">Temperature</label>
            <select
              className="field-select"
              value={local.tempUnit}
              onChange={e => update('tempUnit', e.target.value)}
            >
              <option value="fahrenheit">Fahrenheit (°F)</option>
              <option value="celsius">Celsius (°C)</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Weight</label>
            <select
              className="field-select"
              value={local.weightUnit}
              onChange={e => update('weightUnit', e.target.value)}
            >
              <option value="grams">Grams (g)</option>
              <option value="ounces">Ounces (oz)</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-heading">Brew Defaults</h3>

          <div className="field-group">
            <label className="field-label">Default Brew Ratio</label>
            <select
              className="field-select"
              value={local.defaultRatio}
              onChange={e => update('defaultRatio', e.target.value)}
            >
              <option value="1:15">1:15 (Stronger)</option>
              <option value="1:16">1:16 (Espresso-style)</option>
              <option value="1:17">1:17 (Standard)</option>
              <option value="1:18">1:18 (Pour over)</option>
              <option value="1:20">1:20 (Immersion)</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Advanced Taste Profile</label>
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="advancedTaste"
                checked={local.showAdvancedTaste}
                onChange={e => update('showAdvancedTaste', e.target.checked)}
              />
              <label htmlFor="advancedTaste">
                Show Body, Complexity, Aftertaste, and Smoothness sliders
              </label>
            </div>
          </div>
        </div>
      </div>

      {saved && (
        <div className="settings-message">
          ✓ Settings saved — changes are now applied
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
