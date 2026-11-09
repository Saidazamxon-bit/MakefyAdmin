const nf = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 });

export const num = (n) => nf.format(Number(n) || 0).replace(/,/g, ' ');
export const money = (n) => `${num(n)} so'm`;
export const signedMoney = (n) => `${Number(n) > 0 ? '+' : ''}${num(n)}`;

export function date(v) {
  if (!v) return '—';
  const s = String(v);
  if (/^\d{2}\.\d{2}\.\d{4}/.test(s)) return s; // "d.m.Y | H:i" — eski format
  const d = new Date(s.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return s;
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function ago(v) {
  if (!v) return '';
  const d = new Date(String(v).replace(' ', 'T'));
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(s)) return '';
  if (s < 60) return 'hozir';
  if (s < 3600) return `${Math.floor(s / 60)} daq oldin`;
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} kun oldin`;
  return date(v).slice(0, 10);
}

export const shortDay = (iso) => {
  const [, m, d] = String(iso).split('-');
  return `${d}.${m}`;
};
