const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');

async function request(method, path, body) {
  const token   = localStorage.getItem('jwt');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 401) {
    // Auth endpoints use 401 to mean bad credentials, not expired session
    if (path.startsWith('/auth/')) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Invalid email or password.');
    }
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${localStorage.getItem('jwt')}`;
      res = await fetch(`${BASE}${path}`, { ...opts, headers });
    } else {
      window.dispatchEvent(new Event('auth:logout'));
      throw new Error('Session expired. Please sign in again.');
    }
  }

  if (res.status === 204) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function tryRefresh() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('jwt',          data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

const get  = (path)       => request('GET',    path);
const post = (path, body) => request('POST',   path, body);
const del  = (path)       => request('DELETE', path);

// Auth
export const register = (email, password) => post('/auth/register', { email, password });
export const login    = (email, password) => post('/auth/login',    { email, password });
export const logout   = (refreshToken)    => post('/auth/logout',   { refreshToken });

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
export const getBestParams      = (brewMethodId, minBrewCount = 3) =>
  get(`/analytics/best?brewMethodId=${brewMethodId}&minBrewCount=${minBrewCount}`);
export const getExtractionTrend = (brewMethodId, beanOriginId) => {
  const qs = beanOriginId ? `&beanOriginId=${beanOriginId}` : '';
  return get(`/analytics/trend?brewMethodId=${brewMethodId}${qs}`);
};
