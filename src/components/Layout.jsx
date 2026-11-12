import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bot, Brain, CreditCard, Gift, LayoutGrid, Crown, FileClock, Gauge, Layers, LogOut, Megaphone, Menu, MessageSquare, Moon,
  PackageCheck, Palette, RefreshCw, Settings, Shapes, ShieldAlert, ShieldCheck, Sun, Ticket, Tv, Users, X, Zap,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useApi } from '../lib/hooks';
import { cx } from './ui';

export const NAV = [
  { group: 'Asosiy', items: [
    { to: '/', end: true, label: 'Boshqaruv paneli', icon: Gauge },
    { to: '/users', label: 'Foydalanuvchilar', icon: Users },
    { to: '/bots', label: 'Botlar', icon: Bot },
    { to: '/requests', label: "So'rovlar va buyurtmalar", icon: PackageCheck, badge: 'requestsPending' },
    { to: '/chat', label: 'Chat', icon: MessageSquare, badge: 'chatUnread' },
    { to: '/broadcast', label: 'Xabar yuborish', icon: Megaphone },
    { to: '/moderation', label: 'Moderatsiya', icon: ShieldAlert },
  ] },
  { group: 'Moliya', items: [
    { to: '/payments', label: "To'lovlar va kartalar", icon: CreditCard },
    { to: '/autopay', label: "Avto to'lov (botlar)", icon: Zap },
    { to: '/plans', label: 'Platforma tariflari', icon: Crown },
    { to: '/bot-plans', label: 'Bot tariflari', icon: Layers },
    { to: '/webapp-designs', label: 'Web App dizaynlari', icon: Palette },
    { to: '/promocodes', label: 'Promokodlar', icon: Ticket },
    { to: '/baraban', label: 'Baraban', icon: Gift },
    { to: '/channels', label: 'Pul ishlash kanallari', icon: Tv },
  ] },
  { group: 'Tizim', items: [
    { to: '/templates', label: 'Shablonlar', icon: RefreshCw, badge: 'templatesOutdated' },
    { to: '/template-content', label: 'Shablon katalogi', icon: LayoutGrid },
    { to: '/categories', label: 'Bot turlari', icon: Shapes },
    { to: '/ai', label: 'AI sozlamalari', icon: Brain },
    { to: '/settings', label: 'Bot sozlamalari', icon: Settings },
    { to: '/security', label: 'Xavfsizlik va loglar', icon: ShieldCheck },
  ] },
];

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('mfa-theme', dark ? 'dark' : 'light'); } catch { /* private mode */ }
  }, [dark]);
  return [dark, setDark];
}

function Sidebar({ counts, onNavigate }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Asosiy menyu">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/80">{g.group}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const n = it.badge ? counts?.[it.badge] : 0;
              return (
                <li key={it.to}>
                  <NavLink
                    to={it.to}
                    end={it.end}
                    onClick={onNavigate}
                    className={({ isActive }) => cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-surface-2 hover:text-fg')}
                  >
                    <it.icon className="size-[18px] shrink-0" />
                    <span className="flex-1 truncate">{it.label}</span>
                    {n > 0 && <span className="tabular rounded-full bg-bad px-1.5 py-px text-[11px] font-semibold text-white">{n > 99 ? '99+' : n}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-fg">M</span>
      <div className="leading-tight">
        <p className="text-sm font-semibold">Makefy</p>
        <p className="text-[11px] text-muted">Admin panel</p>
      </div>
    </div>
  );
}

export default function Layout() {
  const { adminId, logout } = useAuth();
  const [dark, setDark] = useTheme();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  // Menyudagi qizil raqamlar (har 60 soniyada yangilanadi)
  const { data } = useApi('panel/dashboard', { interval: 60000 });
  const counts = data ? { ...data.stats, templatesOutdated: data.templates?.outdated } : null;

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5"><Brand /></div>
        <Sidebar counts={counts} />
        <div className="border-t border-line p-3 text-xs text-muted">Admin ID: <span className="tabular">{adminId || '—'}</span></div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="animate-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Brand />
              <button type="button" aria-label="Menyuni yopish" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-muted hover:bg-surface-2"><X className="size-5" /></button>
            </div>
            <Sidebar counts={counts} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
          <button type="button" aria-label="Menyu" onClick={() => setOpen(true)} className="-ml-1 rounded-md p-2 text-muted hover:bg-surface-2 lg:hidden"><Menu className="size-5" /></button>
          <div className="lg:hidden"><Brand /></div>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" aria-label="Mavzu" title={dark ? "Yorug' rejim" : "Qorong'i rejim"} onClick={() => setDark(!dark)} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg">
              {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
            <NavLink to="/security" title="Loglar" className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg"><FileClock className="size-[18px]" /></NavLink>
            <button type="button" onClick={logout} className="ml-1 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg">
              <LogOut className="size-4" /><span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
