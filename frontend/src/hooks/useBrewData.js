import { useState, useEffect, useCallback } from 'react';
import { getBeanOrigins, getBrewMethods, getBrews } from '../utils/api';

export function useLookups() {
  const [origins, setOrigins] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getBeanOrigins(), getBrewMethods()])
      .then(([o, m]) => { setOrigins(o); setMethods(m); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { origins, methods, loading, error };
}

export function useBrews(filters) {
  const [brews, setBrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    getBrews(filters)
      .then(setBrews)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  useEffect(() => { refresh(); }, [refresh]);

  return { brews, loading, error, refresh };
}
