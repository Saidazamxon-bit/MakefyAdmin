// Backend JSON API bilan yagona aloqa nuqtasi.
// Brauzer faqat shu saytning /api/index?__path=... manziliga murojaat qiladi (Vercel proksi → PHP backend),
// shuning uchun sessiya cookie'si birinchi tomon (first-party) bo'lib qoladi va CORS kerak emas.
const MOCK = import.meta.env.VITE_MOCK === '1'; // `npm run dev:mock` — backendsiz namunaviy ma'lumotlar
let csrfToken = null;
const listeners = new Set();

export function setCsrfToken(t) { csrfToken = t || null; }

// Chatdagi rasmlar kabi backend'dagi fayllar ("/uploads/...") — to'liq manzilga aylantiriladi.
const BACKEND = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
export function mediaUrl(p) {
  if (!p || /^https?:\/\//i.test(p) || !BACKEND) return p;
  return `${BACKEND}${p.startsWith('/') ? p : `/${p}`}`;
}
/** 401 (admin sessiyasi tugagan) bo'lganda chaqiriladi. */
export function onUnauthorized(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function buildUrl(path) {
  const [p, q = ''] = path.replace(/^\/+/, '').split('?');
  const params = new URLSearchParams();
  params.set('__path', p.replace(/\.php$/, ''));
  new URLSearchParams(q).forEach((v, k) => params.append(k, v));
  return `/api/index?${params.toString()}`;
}

async function request(path, { method = 'GET', body, retry = true } = {}) {
  if (MOCK) return (await import('./mock.js')).mockRequest(path, method, body);
  const headers = { 'Cache-Control': 'no-store' };
  let payload;
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json;charset=UTF-8';
    payload = JSON.stringify({ ...(body || {}), _csrf_token: csrfToken });
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  let res;
  try {
    res = await fetch(buildUrl(path), { method, headers, body: payload, credentials: 'include', cache: 'no-store', signal: ctrl.signal });
  } catch (e) {
    clearTimeout(timer);
    throw new ApiError(e?.name === 'AbortError' ? 'Server javob bermadi (vaqt tugadi).' : "Tarmoq xatosi. Internetni tekshiring.", 'NETWORK', 0);
  }
  let json;
  try {
    json = JSON.parse(await res.text());
  } catch {
    clearTimeout(timer);
    throw new ApiError(`Server noto'g'ri javob qaytardi (HTTP ${res.status}).`, 'BAD_RESPONSE', res.status);
  }
  clearTimeout(timer);
  if (!json.ok) {
    if (retry && method !== 'GET' && json.error_code === 'CSRF_INVALID') {
      const s = await request('panel/session', { retry: false });
      setCsrfToken(s?.csrfToken);
      return request(path, { method, body, retry: false });
    }
    if (json.error_code === 'ADMIN_REQUIRED') listeners.forEach((fn) => fn());
    throw new ApiError(json.error || 'Xatolik yuz berdi.', json.error_code || 'ERROR', res.status);
  }
  return json.data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
};

/** ?a=1&b=2 — bo'sh qiymatlarsiz */
export function qs(obj) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '' && v !== 'all') p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : '';
}
