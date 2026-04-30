import { useState, useEffect, useMemo } from 'react';
import { getAverages, getBestParams, getExtractionTrend } from '../utils/api';

function fmtTime(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AnalyticsDashboard({ methods }) {
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [averages, setAverages] = useState([]);
  const [best, setBest]         = useState(null);
  const [trend, setTrend]       = useState([]);
  const [loading, setLoading]   = useState(false);

  // Pick first method on initial render
  useEffect(() => {
    if (methods.length && !selectedMethodId) {
      setSelectedMethodId(String(methods[0].id));
    }
  }, [methods, selectedMethodId]);

  useEffect(() => {
    if (!selectedMethodId) return;
    setLoading(true);
    Promise.all([
      getAverages({ brewMethodId: selectedMethodId, minScore: 1 }),
      getBestParams(selectedMethodId, 1),
      getExtractionTrend(selectedMethodId),
    ])
      .then(([avg, b, tr]) => {
        setAverages(avg);
        setBest(b);
        setTrend(tr);
      })
      .catch(err => {
        console.error('Analytics load failed:', err);
        setLoading(false);
      })
      .finally(() => setLoading(false));
  }, [selectedMethodId]);

  const selectedMethod = methods.find(m => m.id === parseInt(selectedMethodId));
  const methodName = selectedMethod?.name || '';

  return (
    <div>
      <div className="section-head">
        <span className="section-num">03</span>
        <h2 className="section-title">Analytics <em>dashboard</em></h2>
        <div className="section-line" />
      </div>

      <div className="filters">
        {methods.map(m => (
          <button
            key={m.id}
            className={`filter-pill ${parseInt(selectedMethodId) === m.id ? 'active' : ''}`}
            onClick={() => setSelectedMethodId(String(m.id))}
          >{m.name}</button>
        ))}
        <span className="filter-count">
          {loading ? 'Querying…' : 'Powered by SQL Server stored procedures'}
        </span>
      </div>

      {/* Best parameters card */}
      <BestParamsCard best={best} methodName={methodName} loading={loading} />

      <div className="analytics-grid">
        <ScoreByOriginChart averages={averages} loading={loading} />
        <RatioByOriginChart averages={averages} loading={loading} />
        <ExtractionScatter trend={trend} methodName={methodName} loading={loading} />
      </div>
    </div>
  );
}

function BestParamsCard({ best, methodName, loading }) {
  if (loading) {
    return (
      <div className="best-card">
        <div className="chart-loading">Querying database…</div>
      </div>
    );
  }
  if (!best) {
    return (
      <div className="best-card">
        <div className="best-eyebrow">Optimal parameters</div>
        <div className="chart-empty">
          Not enough data yet — log a few {methodName.toLowerCase()} brews to see your best recipe
        </div>
      </div>
    );
  }
  return (
    <div className="best-card">
      <div className="best-head">
        <div>
          <div className="best-eyebrow">
            Optimal parameters · {best.brewCount} {best.brewCount === 1 ? 'data point' : 'data points'}
          </div>
          <h3 className="best-title">
            Best <em>{methodName.toLowerCase()}</em> recipe
          </h3>
        </div>
        <div>
          <div className="best-score">{best.avgScore.toFixed(1)}</div>
          <div className="best-score-sub">Avg score / 10</div>
        </div>
      </div>
      <div className="params-grid">
        <ParamCell label="Coffee" value={`${best.coffeeGrams}g`} />
        <ParamCell label="Water"  value={`${best.waterGrams}g`} />
        <ParamCell label="Ratio"  value={`1:${parseFloat(best.ratioRounded).toFixed(1)}`} />
        <ParamCell label="Temp"   value={best.tempRounded ? `${best.tempRounded}°F` : '—'} />
        <ParamCell label="Time"   value={fmtTime(best.avgExtractionSec)} />
      </div>
    </div>
  );
}

function ParamCell({ label, value }) {
  return (
    <div className="param-cell">
      <span className="param-label">{label}</span>
      <span className="param-value">{value}</span>
    </div>
  );
}

function ScoreByOriginChart({ averages, loading }) {
  const top = averages.slice(0, 6);
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="chart-title">Avg score by origin</div>
        <div className="chart-sub">Top {top.length}</div>
      </div>
      {loading ? (
        <div className="chart-loading">Loading…</div>
      ) : top.length === 0 ? (
        <div className="chart-empty">No data</div>
      ) : (
        top.map((a, i) => {
          const pct = (a.avgOverallScore / 10) * 100;
          return (
            <div className="bar-row" key={`${a.origin}-${i}`}>
              <span className="bar-label">{a.origin}</span>
              <div className="bar-track">
                <div
                  className={`bar-fill ${pct < 75 ? 'dim' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="bar-val">{a.avgOverallScore.toFixed(1)}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

function RatioByOriginChart({ averages, loading }) {
  const top = averages.slice(0, 6);
  // Map ratios from 10-20 range to 0-100% bar
  const minR = 10, maxR = 20;
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="chart-title">Avg ratio by origin</div>
        <div className="chart-sub">1:X scale</div>
      </div>
      {loading ? (
        <div className="chart-loading">Loading…</div>
      ) : top.length === 0 ? (
        <div className="chart-empty">No data</div>
      ) : (
        top.map((a, i) => {
          const r = parseFloat(a.avgBrewRatio);
          const pct = Math.max(5, Math.min(100, ((r - minR) / (maxR - minR)) * 100));
          return (
            <div className="bar-row" key={`${a.origin}-${i}`}>
              <span className="bar-label">{a.origin}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="bar-val">1:{r.toFixed(1)}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

function ExtractionScatter({ trend, methodName, loading }) {
  // Layout
  const W = 600, H = 220;
  const padL = 40, padR = 20, padT = 20, padB = 40;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const { points, xMin, xMax, sweetSpot } = useMemo(() => {
    if (!trend.length) return { points: [], xMin: 0, xMax: 1, sweetSpot: null };

    const times = trend.map(t => t.extractionTimeSec);
    const xMin = Math.min(...times) * 0.9;
    const xMax = Math.max(...times) * 1.05;

    // Sweet spot = parameter window where avg score >= 8
    const highScoring = trend.filter(t => t.overallScore >= 8);
    let sweetSpot = null;
    if (highScoring.length >= 3) {
      const ssTimes = highScoring.map(t => t.extractionTimeSec);
      sweetSpot = {
        min: Math.min(...ssTimes),
        max: Math.max(...ssTimes),
      };
    }

    const points = trend.map(t => ({
      ...t,
      cx: padL + ((t.extractionTimeSec - xMin) / (xMax - xMin)) * innerW,
      cy: padT + (1 - (t.overallScore / 10)) * innerH,
    }));

    return { points, xMin, xMax, sweetSpot };
  }, [trend, innerW, innerH, padL, padT]);

  function colorForScore(s) {
    if (s >= 9) return '#e8a878';
    if (s >= 7) return '#c9a66b';
    if (s >= 5) return 'rgba(240,227,208,0.55)';
    return '#a85a3c';
  }

  const xTicks = useMemo(() => {
    if (!trend.length) return [];
    const span = xMax - xMin;
    const step = span / 4;
    return [0, 1, 2, 3, 4].map(i => Math.round(xMin + step * i));
  }, [trend, xMin, xMax]);

  return (
    <div className="chart-card full-width">
      <div className="chart-head">
        <div>
          <div className="chart-title">Score vs extraction time</div>
          <div className="chart-sub" style={{ marginTop: 2 }}>
            Each dot is a {methodName.toLowerCase()} brew · find your sweet spot
          </div>
        </div>
        <div className="chart-sub">usp_GetExtractionTrend · SQL Server</div>
      </div>

      {loading ? (
        <div className="chart-loading">Loading…</div>
      ) : !trend.length ? (
        <div className="chart-empty">Log some brews to populate this chart</div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="220" style={{ display: 'block' }}>
          {/* Y axis */}
          <line x1={padL} y1={padT} x2={padL} y2={H - padB}
                stroke="rgba(212,148,99,0.15)" strokeWidth="0.5" />
          {/* X axis */}
          <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB}
                stroke="rgba(212,148,99,0.15)" strokeWidth="0.5" />

          {/* Y labels (score) */}
          {[10, 5, 0].map((v, i) => {
            const y = padT + (1 - v / 10) * innerH;
            return (
              <text key={v} x={padL - 8} y={y + 3}
                    fill="rgba(240,227,208,0.4)" fontFamily="JetBrains Mono"
                    fontSize="9" textAnchor="end">{v}</text>
            );
          })}

          {/* X labels (time) */}
          {xTicks.map((t, i) => (
            <text key={t + '-' + i}
                  x={padL + (i / 4) * innerW}
                  y={H - padB + 16}
                  fill="rgba(240,227,208,0.4)" fontFamily="JetBrains Mono"
                  fontSize="9" textAnchor="middle">{t}s</text>
          ))}

          {/* Sweet spot band */}
          {sweetSpot && (
            <>
              <rect
                x={padL + ((sweetSpot.min - xMin) / (xMax - xMin)) * innerW}
                y={padT}
                width={((sweetSpot.max - sweetSpot.min) / (xMax - xMin)) * innerW}
                height={innerH * 0.3}
                fill="rgba(212,148,99,0.05)"
                stroke="rgba(212,148,99,0.2)"
                strokeDasharray="2,3"
                strokeWidth="0.5"
              />
              <text
                x={padL + ((sweetSpot.min + sweetSpot.max) / 2 - xMin) / (xMax - xMin) * innerW}
                y={padT + 16}
                fill="rgba(212,148,99,0.6)"
                fontFamily="JetBrains Mono" fontSize="9"
                textAnchor="middle"
                letterSpacing="1.5"
              >SWEET SPOT</text>
            </>
          )}

          {/* Data points */}
          {points.map(p => (
            <circle
              key={p.id}
              cx={p.cx} cy={p.cy} r={p.overallScore >= 8 ? 4 : 3.5}
              fill={colorForScore(p.overallScore)}
              opacity={p.overallScore >= 8 ? 0.95 : 0.7}
            >
              <title>
                {p.overallScore}/10 · {p.extractionTimeSec}s
                {p.grindSize ? ` · ${p.grindSize}` : ''}
                {p.notes ? ` · ${p.notes}` : ''}
              </title>
            </circle>
          ))}

          {/* Axis titles */}
          <text x={padL + innerW / 2} y={H - 6}
                fill="rgba(240,227,208,0.4)" fontFamily="JetBrains Mono"
                fontSize="9" textAnchor="middle" letterSpacing="1.5">
            EXTRACTION TIME
          </text>
          <text x={12} y={padT + innerH / 2}
                fill="rgba(240,227,208,0.4)" fontFamily="JetBrains Mono"
                fontSize="9" textAnchor="middle" letterSpacing="1.5"
                transform={`rotate(-90 12 ${padT + innerH / 2})`}>
            SCORE
          </text>
        </svg>
      )}
    </div>
  );
}
