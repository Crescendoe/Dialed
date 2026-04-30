import { createContext, useContext, useState } from 'react';

const DEFAULT_SETTINGS = {
  tempUnit:          'fahrenheit',
  weightUnit:        'grams',
  defaultRatio:      '1:17',
  showAdvancedTaste: false,
};

function load() {
  return {
    tempUnit:          localStorage.getItem('tempUnit')          || DEFAULT_SETTINGS.tempUnit,
    weightUnit:        localStorage.getItem('weightUnit')        || DEFAULT_SETTINGS.weightUnit,
    defaultRatio:      localStorage.getItem('defaultRatio')      || DEFAULT_SETTINGS.defaultRatio,
    showAdvancedTaste: localStorage.getItem('showAdvancedTaste') === 'true',
  };
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  function saveSettings(next) {
    Object.entries(next).forEach(([k, v]) => localStorage.setItem(k, String(v)));
    setSettings(next);
  }

  function resetSettings() {
    saveSettings(DEFAULT_SETTINGS);
  }

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
