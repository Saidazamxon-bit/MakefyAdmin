import { Check, Lock } from 'lucide-react';
import { cx } from './ui';

// Shablon botlar Web App dizaynlari (backend: includes/webapp_theme.php → mkwtDesigns)
export const DESIGNS = [
  { id: 'classic', name: 'Standart', sw: ['#5b7cfa', '#8aa2ff', '#12151c'] },
  { id: 'minimal', name: 'Minimalism', sw: ['#18181b', '#e4e4e7', '#ffffff'] },
  { id: 'bento', name: 'Bento Grid', sw: ['#7c6cf6', '#ec4899', '#2fbf71'] },
  { id: 'glass', name: 'Glassmorphism', sw: ['#a78bfa', '#ec4899', '#14b8c4'] },
  { id: 'futuristic', name: 'Futuristic', sw: ['#00e5ff', '#ff2bd6', '#05070e'] },
  { id: 'brutal', name: 'Neo-Brutalism', sw: ['#ffd23f', '#2f54ff', '#111111'] },
];
export const designName = (id) => DESIGNS.find((d) => d.id === id)?.name || id;

export function Swatches({ colors, size = 'size-3' }) {
  return <span className="inline-flex gap-1">{colors.map((c) => <i key={c} className={cx(size, 'rounded-sm ring-1 ring-black/10')} style={{ background: c }} />)}</span>;
}

/**
 * Dizaynlarni belgilash (tarif yoki global).
 *  value: ochiq dizaynlar ro'yxati; disabledIds: platformada o'chirilganlar (qulf bilan ko'rsatiladi)
 *  'classic' har doim ochiq.
 */
export function DesignChecks({ value, onChange, disabledIds = [], compact }) {
  const toggle = (id) => {
    if (id === 'classic') return;
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };
  return (
    <div className={cx('grid gap-2', compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6')}>
      {DESIGNS.map((d) => {
        const on = d.id === 'classic' || value.includes(d.id);
        const off = disabledIds.includes(d.id);
        return (
          <button
            key={d.id}
            type="button"
            aria-pressed={on}
            disabled={d.id === 'classic'}
            onClick={() => toggle(d.id)}
            title={off ? 'Platformada o‘chirilgan («Web App dizaynlari» bo‘limida)' : undefined}
            className={cx(
              'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
              on ? 'border-brand bg-brand-soft text-fg' : 'border-line bg-surface text-muted hover:bg-surface-2',
              d.id === 'classic' && 'cursor-default opacity-80',
            )}
          >
            <span className={cx('grid size-4 shrink-0 place-items-center rounded border', on ? 'border-brand bg-brand text-brand-fg' : 'border-line')}>
              {on && <Check className="size-3" />}
            </span>
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            {off ? <Lock className="size-3.5 shrink-0 text-warn" /> : <Swatches colors={d.sw.slice(0, 2)} size="size-2.5" />}
          </button>
        );
      })}
    </div>
  );
}
