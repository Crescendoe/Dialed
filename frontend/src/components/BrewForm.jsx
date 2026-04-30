import { useState, useMemo } from 'react';
import { createBrew } from '../utils/api';
import { useSettings } from '../contexts/SettingsContext';

const GRIND_SIZES = ['Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse'];

const OZ_PER_GRAM = 0.035274;
const GRAMS_PER_OZ = 28.3495;

function toDisplayWeight(grams, unit) {
  return unit === 'ounces' ? (grams * OZ_PER_GRAM).toFixed(2) : String(grams);
}

function toDisplayTemp(fahrenheit, unit) {
  if (unit === 'celsius') return String(Math.round((fahrenheit - 32) * 5 / 9));
  return String(fahrenheit);
}

function getInitialForm(settings) {
  const ratioMultiplier = parseInt(settings.defaultRatio.split(':')[1]) || 17;
  const coffeeG = 18;
  const waterG  = coffeeG * ratioMultiplier;
  const isOz    = settings.weightUnit === 'ounces';
  const isCelsius = settings.tempUnit === 'celsius';

  return {
    beanOriginId:      '',
    brewMethodId:      '',
    coffeeGrams:       toDisplayWeight(coffeeG, settings.weightUnit),
    waterGrams:        toDisplayWeight(waterG,  settings.weightUnit),
    extractionTimeSec: '225',
    waterTemp:         toDisplayTemp(200, settings.tempUnit),
    grindSize:         'Medium-Fine',
    acidityScore:      7,
    sweetnessScore:    7,
    bitnessScore:      4,
    bodyScore:         6,
    complexityScore:   5,
    aftertasteScore:   6,
    smoothnessScore:   7,
    overallScore:      8,
    notes:             '',
  };
}

function originLabel(o) {
  let s = o.country;
  if (o.region) s += `, ${o.region}`;
  if (o.processType) s += ` — ${o.processType}`;
  return s;
}

function methodSubtitle(methodName, coffee, water, unit) {
  if (!coffee || !water) return '';
  const c = parseFloat(coffee);
  const w = parseFloat(water);
  if (!c || !w) return '';
  const u = unit === 'ounces' ? 'oz' : 'g';
  return `${c}${u} coffee / ${w}${u} water · ${methodName || 'standard pour'}`;
}

export default function BrewForm({ origins, methods, onSaved }) {
  const { settings } = useSettings();
  const isOz     = settings.weightUnit === 'ounces';
  const isCelsius = settings.tempUnit === 'celsius';

  const [form, setForm]     = useState(() => getInitialForm(settings));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const ratio = useMemo(() => {
    const c = parseFloat(form.coffeeGrams);
    const w = parseFloat(form.waterGrams);
    if (!c || !w) return null;
    return (w / c).toFixed(1);
  }, [form.coffeeGrams, form.waterGrams]);

  const selectedMethod = methods.find(m => m.id === parseInt(form.brewMethodId));

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.beanOriginId || !form.brewMethodId) {
      setError('Origin and method are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Convert display units back to grams / fahrenheit for storage
      const coffeeG = isOz
        ? parseFloat(form.coffeeGrams) * GRAMS_PER_OZ
        : parseFloat(form.coffeeGrams);
      const waterG = isOz
        ? parseFloat(form.waterGrams) * GRAMS_PER_OZ
        : parseFloat(form.waterGrams);
      const tempF = form.waterTemp
        ? isCelsius
          ? parseFloat(form.waterTemp) * 9 / 5 + 32
          : parseFloat(form.waterTemp)
        : null;

      await createBrew({
        beanOriginId:        parseInt(form.beanOriginId),
        brewMethodId:        parseInt(form.brewMethodId),
        coffeeGrams:         coffeeG,
        waterGrams:          waterG,
        extractionTimeSec:   parseInt(form.extractionTimeSec),
        waterTempFahrenheit: tempF,
        grindSize:           form.grindSize || null,
        acidityScore:        parseInt(form.acidityScore),
        sweetnessScore:      parseInt(form.sweetnessScore),
        bitnessScore:        parseInt(form.bitnessScore),
        bodyScore:           parseInt(form.bodyScore),
        complexityScore:     parseInt(form.complexityScore),
        aftertasteScore:     parseInt(form.aftertasteScore),
        smoothnessScore:     parseInt(form.smoothnessScore),
        overallScore:        parseInt(form.overallScore),
        notes:               form.notes || null,
      });
      setForm(getInitialForm(settings));
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(getInitialForm(settings));
    setError(null);
  }

  const weightUnit = isOz ? 'oz' : 'g';
  const tempLabel  = isCelsius ? '°C' : '°F';
  const tempMin    = isCelsius ? 60  : 120;
  const tempMax    = isCelsius ? 100 : 212;

  return (
    <form onSubmit={handleSubmit}>
      <div className="section-head">
        <span className="section-num">01</span>
        <h2 className="section-title">Log a <em>brew</em></h2>
        <div className="section-line" />
      </div>
      <p className="section-sub">
        Every great cup starts as data. Capture the variables, score the result,
        and let the database surface what works.
      </p>

      <div className="form-grid">
        {/* LEFT — variables */}
        <div>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Origin</label>
              <select
                className="field-select"
                value={form.beanOriginId}
                onChange={e => update('beanOriginId', e.target.value)}
                required
              >
                <option value="">Select origin…</option>
                {origins.map(o => (
                  <option key={o.id} value={o.id}>{originLabel(o)}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Method</label>
              <select
                className="field-select"
                value={form.brewMethodId}
                onChange={e => update('brewMethodId', e.target.value)}
                required
              >
                <option value="">Select method…</option>
                {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div className="field-row-3">
            <div className="field-group">
              <label className="field-label">Coffee · {weightUnit}</label>
              <input
                className="field-input" type="number" step="0.01" min="0.01"
                value={form.coffeeGrams}
                onChange={e => update('coffeeGrams', e.target.value)}
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">Water · {weightUnit}</label>
              <input
                className="field-input" type="number" step="0.01" min="0.01"
                value={form.waterGrams}
                onChange={e => update('waterGrams', e.target.value)}
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">Time · sec</label>
              <input
                className="field-input" type="number" min="1"
                value={form.extractionTimeSec}
                onChange={e => update('extractionTimeSec', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Temperature · {tempLabel}</label>
              <input
                className="field-input" type="number" step="0.5"
                min={tempMin} max={tempMax}
                value={form.waterTemp}
                onChange={e => update('waterTemp', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Grind</label>
              <select
                className="field-select"
                value={form.grindSize}
                onChange={e => update('grindSize', e.target.value)}
              >
                <option value="">—</option>
                {GRIND_SIZES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Notes</label>
            <textarea
              className="field-textarea"
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Tasting notes, what changed, what to try next…"
            />
          </div>
        </div>

        {/* RIGHT — ratio + taste */}
        <div>
          <div className="ratio-card">
            <div className="ratio-label">Brew ratio</div>
            <div className="ratio-value">
              1 <em>:</em> {ratio || '—'}
            </div>
            <div className="ratio-detail">
              {methodSubtitle(selectedMethod?.name, form.coffeeGrams, form.waterGrams, settings.weightUnit)}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Taste profile</label>
            <TasteSlider label="Acidity"   value={form.acidityScore}   onChange={v => update('acidityScore',   v)} />
            <TasteSlider label="Sweetness" value={form.sweetnessScore} onChange={v => update('sweetnessScore', v)} />
            <TasteSlider label="Bitterness" value={form.bitnessScore}  onChange={v => update('bitnessScore',   v)} />
            {settings.showAdvancedTaste && <>
              <TasteSlider label="Body"       value={form.bodyScore}       onChange={v => update('bodyScore',       v)} />
              <TasteSlider label="Complexity" value={form.complexityScore} onChange={v => update('complexityScore', v)} />
              <TasteSlider label="Aftertaste" value={form.aftertasteScore} onChange={v => update('aftertasteScore', v)} />
              <TasteSlider label="Smoothness" value={form.smoothnessScore} onChange={v => update('smoothnessScore', v)} />
            </>}
          </div>

          <div className="overall-card">
            <div className="overall-row">
              <span className="overall-label">Overall · {form.overallScore}/10</span>
              <div className="overall-circles">
                {[...Array(10)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`overall-circle ${i < form.overallScore ? 'filled' : ''}`}
                    onClick={() => update('overallScore', i + 1)}
                    aria-label={`Score ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="submit-row">
        <button type="button" className="btn btn-secondary" onClick={handleReset}>
          Reset
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save brew →'}
        </button>
      </div>
    </form>
  );
}

function TasteSlider({ label, value, onChange }) {
  const fill = (value / 10) * 100;
  return (
    <div className="taste-row">
      <span className="taste-label">{label}</span>
      <input
        type="range"
        className="taste-slider"
        min="1" max="10" step="1"
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ '--fill': `${fill}%` }}
        aria-label={`${label} score, ${value} out of 10`}
        aria-valuenow={value}
        aria-valuemin={1}
        aria-valuemax={10}
      />
      <span className="taste-num">{value}</span>
    </div>
  );
}
