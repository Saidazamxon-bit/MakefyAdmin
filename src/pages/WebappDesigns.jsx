import { useMemo, useState } from 'react';
import { Check, Palette, Plus, RotateCcw, X } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useApi, useDebounced } from '../lib/hooks';
import { num } from '../lib/format';
import { useAction } from '../components/feedback';
import { DESIGNS, designName, Swatches } from '../components/designs';
import { Badge, Button, Card, Empty, ErrorBox, Loading, PageHeader, SearchInput, Select, Switch, Table, Tabs, cx } from '../components/ui';

/*
 * Shablon botlar Web App dizaynlari (backend: api/panel/webapp_designs.php, includes/webapp_theme.php).
 *  1) Platforma: dizaynni butunlay yoqish/o'chirish, ranglarni o'zgartirish ruxsati, tayyor ranglar
 *  2) Tariflar: har bir tarifda qaysi dizaynlar va ranglar ochiq (bot_tariflar.features)
 *  3) Botlar: istalgan botning dizayni/rangi (ixtiyoriy: tarifdan qat'i nazar)
 */
const HEX = /^#[0-9a-f]{6}$/i;

function GlobalCard({ data, onSaved }) {
  const [disabled, setDisabled] = useState(data.global.disabled);
  const [colors, setColors] = useState(data.global.colors);
  const [presets, setPresets] = useState(data.global.presets);
  const [pick, setPick] = useState('#5b7cfa');
  const { busy, run } = useAction();
  const dirty = JSON.stringify([disabled, colors, presets]) !== JSON.stringify([data.global.disabled, data.global.colors, data.global.presets]);
  const counts = Object.fromEntries((data.designs || []).map((d) => [d.id, d.bots]));
  const save = async () => { if (await run('g', () => api.post('panel/webapp_designs', { action: 'global', disabled, colors, presets }))) onSaved(); };
  return (
    <Card title="Platforma bo'yicha" subtitle="O'chirilgan dizayn hech bir botda ko'rinmaydi (ishlatayotgan botlar «Standart»ga qaytadi)."
      actions={<Button size="sm" variant="primary" loading={busy === 'g'} disabled={!dirty} onClick={save}>Saqlash</Button>}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DESIGNS.map((d) => {
          const on = d.id === 'classic' || !disabled.includes(d.id);
          return (
            <div key={d.id} className={cx('flex items-center gap-3 rounded-xl border p-3', on ? 'border-line' : 'border-line bg-surface-2 opacity-75')}>
              <span className={`grid size-11 shrink-0 place-items-center rounded-lg ring-1 ring-black/10`} style={{ background: `linear-gradient(135deg, ${d.sw[0]}, ${d.sw[1]})` }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{d.name}</p>
                <p className="text-xs text-muted">{num(counts[d.id] || 0)} ta botda tanlangan</p>
              </div>
              <Switch checked={on} disabled={d.id === 'classic'} onChange={(v) => setDisabled((x) => (v ? x.filter((i) => i !== d.id) : [...x, d.id]))} />
            </div>
          );
        })}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line p-4">
          <Switch checked={colors} onChange={setColors} label="Bot egalari Web App ranglarini o'zgartira oladi" />
          <p className="mt-2 text-xs text-muted">O'chirilsa — barcha botlar dizaynning o'z ranglariga qaytadi (tariflardagi ruxsatdan qat'i nazar).</p>
        </div>
        <div className="rounded-xl border border-line p-4">
          <p className="mb-2 text-sm font-medium">Tayyor ranglar <span className="text-xs font-normal text-muted">(bot egalariga taklif qilinadi)</span></p>
          <div className="flex flex-wrap items-center gap-2">
            {presets.map((c) => (
              <span key={c} className="group relative">
                <span className="block size-8 rounded-lg ring-1 ring-black/10" style={{ background: c }} title={c} />
                <button type="button" aria-label={`${c} ni olib tashlash`} onClick={() => setPresets((x) => x.filter((i) => i !== c))}
                  className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-bad text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"><X className="size-3" /></button>
              </span>
            ))}
            <span className="flex items-center gap-1.5 rounded-lg border border-dashed border-line p-1 pl-1.5">
              <input type="color" value={pick} onChange={(e) => setPick(e.target.value)} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Rang tanlash" />
              <Button size="sm" variant="ghost" icon={Plus} disabled={presets.includes(pick) || presets.length >= 24} onClick={() => setPresets((x) => [...x, pick])}>Qo'shish</Button>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PlanRow({ p, disabledIds, onSaved }) {
  const [all, setAll] = useState(p.designs === null);
  const [list, setList] = useState(p.designs || DESIGNS.map((d) => d.id));
  const [colors, setColors] = useState(p.colors);
  const { busy, run } = useAction();
  const dirty = all !== (p.designs === null) || colors !== p.colors || (!all && JSON.stringify([...list].sort()) !== JSON.stringify([...(p.designs || DESIGNS.map((d) => d.id))].sort()));
  const has = (id) => id === 'classic' || all || list.includes(id);
  const toggle = (id) => {
    if (id === 'classic') return;
    if (all) { setAll(false); setList(DESIGNS.map((d) => d.id).filter((x) => x !== id)); return; }
    setList((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]));
  };
  const save = async () => {
    const designs = all ? null : ['classic', ...list.filter((d) => d !== 'classic')];
    if (await run('p', () => api.post('panel/webapp_designs', { action: 'plan', id: p.id, designs, colors }))) onSaved();
  };
  return (
    <tr className="border-b border-line last:border-0">
      <td className="whitespace-nowrap py-2.5 pl-4 pr-3 sm:pl-5">
        <span className="font-medium">{p.nomi}</span>
        {!p.faol && <Badge tone="bad" className="ml-2">yashirin</Badge>}
      </td>
      {DESIGNS.map((d) => (
        <td key={d.id} className="px-2 py-2.5 text-center">
          <button type="button" aria-label={`${p.nomi}: ${d.name}`} aria-pressed={has(d.id)} disabled={d.id === 'classic'} onClick={() => toggle(d.id)}
            className={cx('mx-auto grid size-7 place-items-center rounded-md border transition-colors', has(d.id) ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-surface text-transparent hover:border-brand/50', disabledIds.includes(d.id) && 'opacity-50', d.id === 'classic' && 'cursor-default opacity-70')}>
            <Check className="size-4" />
          </button>
        </td>
      ))}
      <td className="px-2 py-2.5 text-center"><span className="inline-flex"><Switch checked={colors} onChange={setColors} /></span></td>
      <td className="whitespace-nowrap py-2.5 pl-2 pr-4 text-right sm:pr-5">
        <Button size="sm" variant={dirty ? 'primary' : 'secondary'} loading={busy === 'p'} disabled={!dirty} onClick={save}>Saqlash</Button>
      </td>
    </tr>
  );
}

function PlansCard({ data, onSaved }) {
  const types = useMemo(() => [...new Map(data.plans.map((p) => [p.botTuri, p.typeName])).entries()], [data.plans]);
  const [type, setType] = useState('');
  const cur = type || types[0]?.[0];
  const rows = data.plans.filter((p) => p.botTuri === cur);
  return (
    <Card title="Tariflar bo'yicha" subtitle="Belgilangan dizaynlar shu tarifdagi botlar uchun ochiq. Standart har doim ochiq. Narx va limitlar — «Bot tariflari» bo'limida.">
      {types.length ? (
        <>
          <Tabs value={cur} onChange={setType} tabs={types.map(([k, n]) => ({ value: k, label: n }))} />
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="py-2.5 pl-4 pr-3 text-left font-medium sm:pl-5">Tarif</th>
                  {DESIGNS.map((d) => (
                    <th key={d.id} className="px-2 py-2.5 text-center font-medium normal-case tracking-normal">
                      {d.name}
                      {data.global.disabled.includes(d.id) && <span className="mt-0.5 block text-[10.5px] font-normal text-warn">platformada o‘chiq</span>}
                    </th>
                  ))}
                  <th className="px-2 py-2.5 text-center font-medium normal-case tracking-normal">Ranglar</th>
                  <th className="py-2.5 pl-2 pr-4 sm:pr-5" />
                </tr>
              </thead>
              <tbody>{rows.map((p) => <PlanRow key={`${p.id}-${JSON.stringify(p.designs)}-${p.colors}`} p={p} disabledIds={data.global.disabled} onSaved={onSaved} />)}</tbody>
            </table>
          </div>
        </>
      ) : <Empty title="Tariflar topilmadi" />}
    </Card>
  );
}

function BotEditor({ b, onSaved }) {
  const [design, setDesign] = useState(b.design);
  const [color, setColor] = useState(b.colors?.accent || '');
  const [force, setForce] = useState(!!b.force);
  const { busy, run } = useAction();
  const dirty = design !== b.design || color !== (b.colors?.accent || '') || force !== !!b.force;
  const save = async () => {
    const colors = HEX.test(color) ? { accent: color, accent2: b.colors?.accent2 || '' } : null;
    if (await run('b', () => api.post('panel/webapp_designs', { action: 'bot', bot: b.username, design, colors, force }))) onSaved();
  };
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="w-44 shrink-0">
        <Select value={design} onChange={(e) => setDesign(e.target.value)} className="h-8 text-[13px]" aria-label={`@${b.username} dizayni`}>
          {DESIGNS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </div>
      <span className="flex items-center gap-1 rounded-lg border border-line px-1.5 py-1">
        <input type="color" value={color || '#5b7cfa'} onChange={(e) => setColor(e.target.value)} className={cx('size-6 cursor-pointer rounded border-0 bg-transparent p-0', !color && 'opacity-40')} aria-label="Asosiy rang" />
        {color ? <button type="button" aria-label="Standart rang" title="Standart rang" onClick={() => setColor('')} className="rounded p-0.5 text-muted hover:text-fg"><RotateCcw className="size-3.5" /></button> : <span className="pr-1 text-xs text-muted">std</span>}
      </span>
      <label className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted" title="Majburiy: tarifda yopiq bo'lsa ham qo'llanadi (platformada o'chirilgan dizayndan tashqari)">
        <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="size-3.5 accent-[var(--color-brand)]" />Majburiy
      </label>
      <Button size="sm" variant={dirty ? 'primary' : 'secondary'} loading={busy === 'b'} disabled={!dirty} onClick={save}>Saqlash</Button>
    </div>
  );
}

function BotsCard({ disabledIds, onSaved }) {
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const { data, error, loading, reload } = useApi(`panel/webapp_designs${qs({ q: dq })}`);
  const rows = data?.bots || [];
  const done = () => { reload(true); onSaved(); };
  return (
    <Card title="Botlar" subtitle="Istalgan botning Web App dizayni va rangini o'zgartiring. «Majburiy» — tarifda yopiq bo'lsa ham qo'llanadi (platformada o'chirilgan dizayndan tashqari)."
      actions={<SearchInput value={q} onChange={setQ} placeholder="@bot qidirish…" className="w-56" />}>
      <ErrorBox error={error} onRetry={() => reload()} />
      {loading && !data ? <Loading /> : (
        <Table
          dense
          rowKey="username"
          rows={rows}
          empty={<Empty title="Shablon bot topilmadi" />}
          columns={[
            { key: 'username', title: 'Bot', render: (b) => <div className="min-w-0"><p className="font-medium">@{b.username}</p><p className="text-xs text-muted">{b.typeName}{b.tarif ? ` · ${b.tarif}` : ''}</p></div> },
            {
              key: 'applied', title: 'Ilovada hozir', render: (b) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={b.applied.design === b.design ? 'brand' : 'warn'}>{designName(b.applied.design)}</Badge>
                  {b.applied.colors && <Swatches colors={[b.applied.colors.accent, b.applied.colors.accent2].filter(Boolean)} />}
                  {b.force && <Badge tone="info">majburiy</Badge>}
                  {b.applied.design !== b.design && (
                    <span className="text-xs text-warn" title={`Tanlangan: ${designName(b.design)}`}>
                      {designName(b.design)}: {disabledIds.includes(b.design) ? 'platformada o‘chiq' : 'tarifda yopiq'}
                    </span>
                  )}
                </div>
              ),
            },
            { key: 'edit', title: '', align: 'right', render: (b) => <BotEditor key={`${b.design}|${b.colors?.accent || ''}|${b.force ? 1 : 0}`} b={b} onSaved={done} /> },
          ]}
        />
      )}
      {data && data.total > rows.length && <p className="mt-3 text-xs text-muted">{num(rows.length)} / {num(data.total)} ta ko'rsatildi — qidiruvdan foydalaning.</p>}
    </Card>
  );
}

export default function WebappDesigns() {
  const { data, error, loading, reload } = useApi('panel/webapp_designs');
  const [tab, setTab] = useState('global');
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const refresh = () => reload(true);
  return (
    <div className="animate-in space-y-6">
      <PageHeader
        title={<span className="flex items-center gap-2"><Palette className="size-5 text-brand" />Web App dizaynlari</span>}
        description="Shablon botlar mini-ilovalari: 5 xil dizayn (+ Standart), har birida kun/tun. Qaysi dizayn va ranglar qaysi tarifda ochiqligini va istalgan botni shu yerda boshqarasiz."
      />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'global', label: 'Platforma' },
        { value: 'plans', label: 'Tariflar', count: data.plans.length },
        { value: 'bots', label: 'Botlar', count: data.total },
      ]} />
      {tab === 'global' && <GlobalCard key={JSON.stringify(data.global)} data={data} onSaved={refresh} />}
      {tab === 'plans' && <PlansCard data={data} onSaved={refresh} />}
      {tab === 'bots' && <BotsCard disabledIds={data.global.disabled} onSaved={refresh} />}
    </div>
  );
}
