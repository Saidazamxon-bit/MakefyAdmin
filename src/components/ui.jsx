import { createPortal } from 'react-dom';
import { useEffect, useId } from 'react';
import { ChevronLeft, ChevronRight, Inbox, Loader2, Search, X } from 'lucide-react';

export const cx = (...a) => a.filter(Boolean).join(' ');

const BTN = {
  primary: 'bg-brand text-brand-fg hover:opacity-90 shadow-sm',
  secondary: 'bg-surface text-fg border border-line hover:bg-surface-2',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-bad text-white hover:opacity-90 shadow-sm',
  soft: 'bg-brand-soft text-brand hover:opacity-90',
  success: 'bg-ok text-white hover:opacity-90 shadow-sm',
};

export function Button({ variant = 'secondary', size = 'md', loading = false, icon: Icon, className, children, ...rest }) {
  const sz = size === 'sm' ? 'h-8 px-3 text-[13px] gap-1.5' : size === 'icon' ? 'h-9 w-9 justify-center' : 'h-10 px-4 text-sm gap-2';
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || loading}
      className={cx('inline-flex items-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand', sz, BTN[variant], className)}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon ? <Icon className="size-4 shrink-0" /> : null}
      {children}
    </button>
  );
}

export function Card({ title, subtitle, actions, className, bodyClass, children }) {
  return (
    <section className={cx('rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,.04)]', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx('p-4 sm:p-5', bodyClass)}>{children}</div>
    </section>
  );
}

const TONE = {
  gray: 'bg-surface-2 text-muted',
  brand: 'bg-brand-soft text-brand',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  info: 'bg-info-soft text-info',
};
export function Badge({ tone = 'gray', children, className }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap', TONE[tone], className)}>{children}</span>;
}

export function PageHeader({ title, description, actions, back }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back}
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, icon: Icon, tone = 'brand' }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {Icon && <span className={cx('grid size-8 place-items-center rounded-lg', TONE[tone])}><Icon className="size-4" /></span>}
      </div>
      <p className="tabular mt-2 text-lg font-semibold tracking-tight sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60';

export function Field({ label, hint, error, children, className }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-[13px] font-medium">{label}</span>}
      {typeof children === 'function' ? children(id) : children}
      {error ? <span className="mt-1 block text-xs text-bad">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...p }) {
  return <input {...p} className={cx(inputCls, 'h-10', className)} />;
}
export function Textarea({ className, rows = 4, ...p }) {
  return <textarea rows={rows} {...p} className={cx(inputCls, 'py-2 leading-relaxed', className)} />;
}
export function Select({ className, children, ...p }) {
  return <select {...p} className={cx(inputCls, 'h-10 pr-8', className)}>{children}</select>;
}

export function SearchInput({ value, onChange, placeholder = 'Qidirish…', className }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cx(inputCls, 'h-10 pl-9 pr-8')} />
      {value && (
        <button type="button" aria-label="Tozalash" onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className={cx('inline-flex cursor-pointer select-none items-center gap-2.5', disabled && 'opacity-60 pointer-events-none')}>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line')}
      >
        <span className={cx('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cx('flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors', value === t.value ? 'bg-brand-soft text-brand' : 'text-muted hover:text-fg')}
        >
          {t.label}
          {t.count > 0 && <span className={cx('rounded px-1.5 text-xs', value === t.value ? 'bg-brand text-brand-fg' : 'bg-surface-2')}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cx('size-5 animate-spin text-muted', className)} />;
}

export function Loading({ text = 'Yuklanmoqda…' }) {
  return <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted"><Spinner />{text}</div>;
}

export function Empty({ title = "Ma'lumot yo'q", text, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <span className="mb-3 grid size-11 place-items-center rounded-full bg-surface-2 text-muted"><Icon className="size-5" /></span>
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad">
      <span>{error}</span>
      {onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Qayta urinish</Button>}
    </div>
  );
}

/** Jadval: columns = [{ key, title, render?, className?, align? }] */
export function Table({ columns, rows, rowKey = 'id', onRowClick, empty, dense }) {
  if (!rows?.length) return empty ?? <Empty />;
  return (
    <div className="-mx-4 overflow-x-auto sm:-mx-5">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-muted">
            {columns.map((c) => (
              <th key={c.key} className={cx('whitespace-nowrap px-4 py-2.5 font-medium first:pl-4 sm:first:pl-5 last:pr-4 sm:last:pr-5', c.align === 'right' && 'text-right', c.className)}>{c.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={typeof rowKey === 'function' ? rowKey(r) : r[rowKey] ?? i}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cx('border-b border-line last:border-0', onRowClick && 'cursor-pointer hover:bg-surface-2')}
            >
              {columns.map((c) => (
                <td key={c.key} className={cx('px-4 align-middle first:pl-4 sm:first:pl-5 last:pr-4 sm:last:pr-5', dense ? 'py-2' : 'py-3', c.align === 'right' && 'text-right tabular', c.className)}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, total, limit, onPage }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted">
      <span className="tabular">{(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}</span>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" aria-label="Oldingi" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={ChevronLeft} />
        <span className="tabular px-2">{page} / {pages}</span>
        <Button size="icon" variant="ghost" aria-label="Keyingi" disabled={page >= pages} onClick={() => onPage(page + 1)} icon={ChevronRight} />
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  // Portal: sahifa konteyneridagi animatsiya (transform) «fixed» ni buzib, oynani sahifa pastiga tushirmasin
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" className={cx('animate-in flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h3 className="font-semibold">{title}</h3>
          <button type="button" aria-label="Yopish" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg"><X className="size-4" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function KV({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 border-b border-dashed border-line pb-2">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 truncate text-right font-medium">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Avatar({ name, src, size = 'md' }) {
  const s = size === 'lg' ? 'size-14 text-lg' : size === 'sm' ? 'size-7 text-xs' : 'size-9 text-sm';
  const letters = String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  if (src) return <img src={src} alt="" className={cx('shrink-0 rounded-full object-cover', s)} />;
  return <span className={cx('grid shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand', s)}>{letters}</span>;
}
