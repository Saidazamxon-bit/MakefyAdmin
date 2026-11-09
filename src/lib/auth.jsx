import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, onUnauthorized, setCsrfToken } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, admin: false, adminId: null, botUsername: null, error: '' });

  const refresh = useCallback(async () => {
    try {
      const s = await api.get('panel/session');
      setCsrfToken(s.csrfToken);
      setState({ loading: false, admin: !!s.admin, adminId: s.adminId, botUsername: s.botUsername, error: '' });
      return s;
    } catch (e) {
      setState((p) => ({ ...p, loading: false, admin: false, error: e.message }));
      return null;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => onUnauthorized(() => setState((p) => ({ ...p, admin: false }))), []);

  /** /enter?token=... dagi bir martalik tokenni admin sessiyasiga almashtiradi. */
  const exchange = useCallback(async (token) => {
    await refresh(); // CSRF token
    await api.post('auth/admin_token', { token });
    return refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try { await api.post('panel/session', { action: 'logout' }); } catch { /* baribir chiqamiz */ }
    setState((p) => ({ ...p, admin: false, adminId: null }));
  }, []);

  return <AuthCtx.Provider value={{ ...state, refresh, exchange, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
