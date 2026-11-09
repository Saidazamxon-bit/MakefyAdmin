import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

/** GET so'rov: { data, error, loading, reload }. path o'zgarsa qayta yuklaydi. */
export function useApi(path, { interval = 0 } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const load = useCallback(async (silent = false) => {
    if (!path) return;
    const my = ++seq.current;
    if (!silent) setLoading(true);
    try {
      const d = await api.get(path);
      if (my === seq.current) { setData(d); setError(''); }
    } catch (e) {
      if (my === seq.current) setError(e.message);
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!interval) return undefined;
    const t = setInterval(() => { if (!document.hidden) load(true); }, interval);
    return () => clearInterval(t);
  }, [interval, load]);

  return { data, error, loading, reload: load, setData };
}

/** Kiritishni kechiktirish (qidiruv uchun). */
export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
