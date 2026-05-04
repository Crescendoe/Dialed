import { useState, useEffect, useCallback } from 'react';
import { getBeanOrigins, getBrewMethods, getBrews } from '../utils/api';

export function useLookups(token) {
  const [origins, setOrigins] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([getBeanOrigins(), getBrewMethods()])
      .then(([o, m]) => { setOrigins(o); setMethods(m); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [token]);

  return { origins, methods, loading, error };
}

export function useBrews(filters, token) {
  const [brews, setBrews] = useState([]);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getBrews(filters)
      .then(setBrews)
      .catch(setError)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), token]);

  useEffect(() => { refresh(); }, [refresh]);

  return { brews, loading, error, refresh };
}
