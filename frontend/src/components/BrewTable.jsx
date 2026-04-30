import { useState, useMemo } from 'react';
import { deleteBrew } from '../utils/api';
import { useSettings } from '../contexts/SettingsContext';

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}·${dd}`;
}

function splitOrigin(originString) {
  // Origin comes from API as "Country, Region" — display country/region with separate process
  return originString;
}

export default function BrewTable({ brews, methods, onRefresh }) {
  const { settings } = useSettings();
  const isCelsius = settings.tempUnit === 'celsius';
  const [methodFilter, setMethodFilter] = useState('');
  const [scoreFilter, setScoreFilter]   = useState(0);
  const [deleting, setDeleting]         = useState(null);

  const filtered = useMemo(() => {
    return brews.filter(b => {
      if (methodFilter && b.brewMethod !== methodFilter) return false;
      if (scoreFilter && b.overallScore < scoreFilter) return false;
      return true;
    });
  }, [brews, methodFilter, scoreFilter]);

  async function handleDelete(id) {
    if (!confirm('Delete this brew?')) return;
    setDeleting(id);
    try {
      await deleteBrew(id);
      onRefresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="section-head">
        <span className="section-num">02</span>
        <h2 className="section-title">Brew <em>log</em></h2>
        <div className="section-line" />
      </div>

      <div className="filters">
        <button
          className={`filter-pill ${methodFilter === '' ? 'active' : ''}`}
          onClick={() => setMethodFilter('')}
        >All methods</button>
        {methods.map(m => (
          <button
            key={m.id}
            className={`filter-pill ${methodFilter === m.name ? 'active' : ''}`}
            onClick={() => setMethodFilter(m.name)}
          >{m.name}</button>
        ))}
        <span className="filter-divider">|</span>
        <button
          className={`filter-pill ${scoreFilter === 0 ? 'active' : ''}`}
          onClick={() => setScoreFilter(0)}
        >Any score</button>
        <button
          className={`filter-pill ${scoreFilter === 7 ? 'active' : ''}`}
          onClick={() => setScoreFilter(7)}
        >7+ score</button>
        <button
          className={`filter-pill ${scoreFilter === 9 ? 'active' : ''}`}
          onClick={() => setScoreFilter(9)}
        >9+ score</button>
        <span className="filter-count">{filtered.length} {filtered.length === 1 ? 'brew' : 'brews'}</span>
      </div>

      <div className="table-wrap table-scroll">
        <table className="brew-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Origin</th>
              <th>Method</th>
              <th>Ratio</th>
              <th>Time</th>
              <th>Temp</th>
              <th>Grind</th>
              <th>Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="table-empty">
                  No brews match these filters
                </td>
              </tr>
            )}
            {filtered.map(b => (
              <tr key={b.id}>
                <td className="cell-mono">{fmtDate(b.brewedAt)}</td>
                <td>
                  <span className="cell-origin">{splitOrigin(b.beanOrigin)}</span>
                </td>
                <td><span className="method-pill">{b.brewMethod}</span></td>
                <td className="cell-mono">1:{parseFloat(b.brewRatio).toFixed(1)}</td>
                <td className="cell-mono">{fmtTime(b.extractionTimeSec)}</td>
                <td className="cell-mono">{b.waterTempFahrenheit
                  ? isCelsius
                    ? `${Math.round((b.waterTempFahrenheit - 32) * 5 / 9 * 10) / 10}°C`
                    : `${b.waterTempFahrenheit}°F`
                  : '—'}</td>
                <td className="cell-mono">{b.grindSize || '—'}</td>
                <td>
                  <span className={`cell-score score-${b.overallScore}`}>{b.overallScore}</span>
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(b.id)}
                    disabled={deleting === b.id}
                    aria-label="Delete brew"
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
