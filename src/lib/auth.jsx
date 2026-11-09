import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, onUnauthorized, setCsrfToken } from './api';

const AuthCtx = createContext(null);

// panel/session hostingda yo'q bo'lsa, eski router so'rovni legacy.php ga beradi va u AUTH_REQUIRED qaytaradi.
const OUTDATED_CODES = ['AUTH_REQUIRED', 'ENDPOINT_NOT_FOUND', 'BAD_RESPONSE'];

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, admin: false, adminId: null, botUsername: null, error: '', backendOutdated: false });

  const refresh = useCallback(async () => {
    try {
      const s = await api.get('panel/session');
      setCsrfToken(s.csrfToken);
      setState({ loading: false, admin: !!s.admin, adminId: s.adminId, botUsername: s.botUsername, error: '', backendOutdated: false });
      return s;
    } catch (e) {
      const outdated = OUTDATED_CODES.includes(e.code);
      if (outdated) {
        // CSRF tokenni eski endpointdan olamiz — kirish (auth/admin_token) baribir ishlay olsin
        try { const me = await api.get('auth/me'); setCsrfToken(me?.csrfToken); } catch { /* tarmoq */ }
      }
      setState((p) => ({ ...p, loading: false, admin: false, error: e.message, backendOutdated: outdated }));
      return null;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => onUnauthorized(() => setState((p) => ({ ...p, admin: false }))), []);

  /** /enter?token=... dagi bir martalik tokenni admin sessiyasiga almashtiradi. */
  const exchange = useCallback(async (token) => {
    await refresh(); // CSRF token
    await api.post('auth/admin_token', { token });
    const s = await refresh();
    if (!s) {
      throw new Error("Token qabul qilindi, lekin backendda admin panel API (api/panel) topilmadi. Backend yangilanishini hostingga yuklang.");
    }
    return s;
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
