const BASE = 'http://localhost:5000/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

// Lookups
export const getBeanOrigins = () => get('/lookups/bean-origins');
export const getBrewMethods = () => get('/lookups/brew-methods');

// Brews
export const getBrews = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, v);
  });
  const qs = params.toString();
  return get(`/brews${qs ? `?${qs}` : ''}`);
};
export const createBrew = (dto) => post('/brews', dto);
export const deleteBrew = (id)  => del(`/brews/${id}`);

// Analytics
export const getAverages = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, v);
  });
  return get(`/analytics/averages?${params.toString()}`);
};
export const getBestParams = (brewMethodId, minBrewCount = 3) =>
  get(`/analytics/best?brewMethodId=${brewMethodId}&minBrewCount=${minBrewCount}`);
export const getExtractionTrend = (brewMethodId, beanOriginId) => {
  const qs = beanOriginId ? `&beanOriginId=${beanOriginId}` : '';
  return get(`/analytics/trend?brewMethodId=${brewMethodId}${qs}`);
};
