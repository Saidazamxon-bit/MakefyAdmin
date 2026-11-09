import { useState } from 'react';
import { cx } from './ui';

/** Ustunli grafik (SVG emas — div, shunda moslashuvchan). data: [{ label, value }] */
export function BarChart({ data, format = (v) => v, height = 180, tone = 'brand' }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const color = tone === 'ok' ? 'bg-ok' : 'bg-brand';
  return (
    <div>
      <div className="relative flex items-end gap-1 sm:gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(2, Math.round(((Number(d.value) || 0) / max) * (height - 8)));
          return (
            <div
              key={d.label + i}
              className="group relative flex h-full flex-1 items-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div className={cx('w-full rounded-t-[4px] transition-opacity', color, hover !== null && hover !== i ? 'opacity-40' : 'opacity-90')} style={{ height: h }} />
              {hover === i && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-xs shadow-md">
                  <span className="text-muted">{d.label}: </span><span className="tabular font-semibold">{format(d.value)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-1.5">
        {data.map((d, i) => (
          <span key={d.label + i} className={cx('flex-1 truncate text-center text-[10px] text-muted', i % 2 === 1 && 'max-sm:invisible')}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Gorizontal taqsimot: items [{ label, value }] */
export function Bars({ items, format = (v) => v }) {
  const max = Math.max(1, ...items.map((x) => x.value));
  return (
    <ul className="space-y-3">
      {items.map((x) => (
        <li key={x.label}>
          <div className="mb-1 flex justify-between gap-2 text-sm"><span className="truncate">{x.label}</span><span className="tabular font-medium">{format(x.value)}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand" style={{ width: `${(x.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
