import { Navigate } from 'react-router-dom';
import { Send, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button, Loading } from '../components/ui';

/** Kirish: login/parol yo'q — faqat platforma botidagi /panelweb buyrug'i orqali (faqat adminlar uchun). */
export default function Login() {
  const { loading, admin, botUsername, backendOutdated, error } = useAuth();
  if (loading) return <Loading />;
  if (admin) return <Navigate to="/" replace />;
  const bot = botUsername || 'Makefybot';
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="animate-in w-full max-w-md rounded-2xl border border-line bg-surface p-7 shadow-xl sm:p-8">
        <span className="mb-5 grid size-12 place-items-center rounded-xl bg-brand text-brand-fg"><ShieldCheck className="size-6" /></span>
        <h1 className="text-xl font-semibold">Makefy admin paneli</h1>
        {backendOutdated && (
          <div className="mt-4 rounded-lg border border-warn/30 bg-warn-soft p-3 text-sm text-warn">
            <b>Backend yangilanmagan.</b> Hostingda admin panel API (<code>api/panel</code>) topilmadi. Backend yangilanish paketini
            hostingga yuklang va <code>.env</code> ga <code>ADMIN_PANEL_URL</code> qo'shing.
          </div>
        )}
        {!backendOutdated && error && (
          <div className="mt-4 rounded-lg border border-bad/30 bg-bad-soft p-3 text-sm text-bad">Server bilan aloqa yo'q: {error}</div>
        )}
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Kirish faqat Telegram orqali. Admin sifatida ro'yxatdan o'tgan hisobingizdan platforma botiga
          <code className="mx-1 rounded bg-surface-2 px-1.5 py-0.5 text-[13px] text-fg">/panelweb</code>
          deb yozing — bot bir martalik kirish havolasini yuboradi.
        </p>
        <ol className="mt-5 space-y-2.5 text-sm">
          {[`@${bot} botini oching`, '/panelweb deb yozing', '«Admin panelga kirish» tugmasini bosing'].map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{i + 1}</span>{s}
            </li>
          ))}
        </ol>
        <a href={`https://t.me/${bot}`} target="_blank" rel="noreferrer" className="mt-6 block">
          <Button variant="primary" icon={Send} className="w-full justify-center">Botni ochish</Button>
        </a>
        <p className="mt-4 text-center text-xs text-muted">Havola 2 daqiqa amal qiladi va faqat bir marta ishlaydi.</p>
      </div>
    </div>
  );
}
