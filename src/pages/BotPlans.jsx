import { useMemo, useState } from 'react';
import { Copy, Palette, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { money, num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { DESIGNS, DesignChecks } from '../components/designs';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, Select, Switch, Tabs, Textarea } from '../components/ui';

// Tarif funksiyalari (features) ichida alohida boshqariladigan kalitlar — JSON maydonida ko'rsatilmaydi
const WA_KEYS = ['webapp_designs', 'webapp_colors'];
const ALL_IDS = DESIGNS.map((d) => d.id);
const otherFeatures = (f) => Object.fromEntries(Object.entries(f || {}).filter(([k]) => !WA_KEYS.includes(k)));

function PlanForm({ t, global, onSaved }) {
  const feat = t.features || {};
  const [f, setF] = useState({ ...t, features: JSON.stringify(otherFeatures(feat), null, 2) });
  const [allDesigns, setAllDesigns] = useState(!Array.isArray(feat.webapp_designs));
  const [designs, setDesigns] = useState(Array.isArray(feat.webapp_designs) ? feat.webapp_designs : ALL_IDS);
  const [colors, setColors] = useState(!('webapp_colors' in feat) || !!feat.webapp_colors);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const { busy, run } = useAction();
  const { confirm } = useFeedback();
  const [jsonErr, setJsonErr] = useState('');
  const save = async () => {
    let features;
    try { features = JSON.parse(f.features || '{}'); setJsonErr(''); } catch { setJsonErr("JSON noto'g'ri"); return; }
    if (!features || typeof features !== 'object' || Array.isArray(features)) { setJsonErr("JSON obyekt bo'lishi kerak: { ... }"); return; }
    features = otherFeatures(features);
    if (!allDesigns) features.webapp_designs = ['classic', ...designs.filter((d) => d !== 'classic')];
    features.webapp_colors = colors;
    const body = { ...f, features, bosqich: +f.bosqich, narx: +f.narx, muddatKun: +f.muddatKun, maxUsers: +f.maxUsers, monthlyMessages: +f.monthlyMessages, webappNarx: +f.webappNarx, tezlik: +f.tezlik };
    if (await run('s', () => api.post('panel/bot_plans', body))) onSaved();
  };
  const del = async () => {
    if (!(await confirm({ text: `«${t.nomi}» tarifi o'chirilsinmi? Bu tarifda bot bo'lsa, o'chirilmaydi.`, danger: true }))) return;
    if (await run('d', () => api.post('panel/bot_plans', { action: 'delete', id: t.id }))) onSaved();
  };
  const openCount = allDesigns ? DESIGNS.length : new Set(['classic', ...designs]).size;
  return (
    <Card
      title={<span className="flex flex-wrap items-center gap-2">{t.nomi}<Badge tone="brand">{t.kalit}</Badge>{!f.faol && <Badge tone="bad">yashirin</Badge>}</span>}
      subtitle={`${num(t.bots)} ta bot shu tarifda · ${money(t.narx)}/oy · Web App: ${openCount}/${DESIGNS.length} dizayn${colors ? ', ranglar ochiq' : ''}`}
      actions={(
        <>
          <Button size="sm" variant="ghost" icon={Trash2} loading={busy === 'd'} disabled={t.bots > 0} title={t.bots > 0 ? 'Bu tarifda botlar bor' : "Tarifni o'chirish"} onClick={del} />
          <Button size="sm" variant="primary" loading={busy === 's'} onClick={save}>Saqlash</Button>
        </>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nomi"><Input value={f.nomi} onChange={set('nomi')} /></Field>
        <Field label="Narx (so'm/oy)"><Input type="number" min="0" value={f.narx} onChange={set('narx')} /></Field>
        <Field label="Muddat (kun)"><Input type="number" min="1" value={f.muddatKun} onChange={set('muddatKun')} /></Field>
        <Field label="Bosqich (tartib)"><Input type="number" min="1" max="9" value={f.bosqich} onChange={set('bosqich')} /></Field>
        <Field label="Maks. foydalanuvchi" hint="0 = cheksiz"><Input type="number" min="0" value={f.maxUsers} onChange={set('maxUsers')} /></Field>
        <Field label="Xabar / oy" hint="0 = cheksiz"><Input type="number" min="0" value={f.monthlyMessages} onChange={set('monthlyMessages')} /></Field>
        <Field label="Web App"><Select value={f.webapp} onChange={set('webapp')}><option value="yopiq">Yopiq</option><option value="pullik">Pullik qo'shimcha</option><option value="bor">Tarifga kiradi</option></Select></Field>
        <Field label="Web App narxi"><Input type="number" min="0" value={f.webappNarx} disabled={f.webapp !== 'pullik'} onChange={set('webappNarx')} /></Field>
        <Field label="Tezlik (1–5)"><Input type="number" min="1" max="5" value={f.tezlik} onChange={set('tezlik')} /></Field>
        <Field label="Boshqa funksiyalar (JSON)" error={jsonErr} hint='Masalan: {"majburiy_obuna": true, "max_kontent": 300}' className="sm:col-span-2 lg:col-span-3">
          <Textarea rows={3} value={f.features} onChange={set('features')} className="font-mono text-xs" />
        </Field>
      </div>

      <div className="mt-5 rounded-xl border border-line bg-surface-2/50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand"><Palette className="size-4" /></span>
            <div>
              <p className="text-sm font-semibold">Web App dizaynlari</p>
              <p className="text-xs text-muted">Shu tarifdagi bot egalari qaysi dizaynlarni qo'llay oladi. Yopiqlarini sinab ko'rishi mumkin, qo'llay olmaydi.</p>
            </div>
          </div>
          <Switch checked={allDesigns} onChange={setAllDesigns} label="Hammasi ochiq" />
        </div>
        {!allDesigns && <DesignChecks value={designs} onChange={setDesigns} disabledIds={global?.disabled || []} />}
        <div className="mt-3"><Switch checked={colors} onChange={setColors} label="Bot egasi Web App ranglarini o'zgartira oladi" /></div>
        {global && !global.colors && colors && <p className="mt-2 text-xs text-warn">Ranglar hozir butun platformada o'chirilgan («Web App dizaynlari» bo'limi).</p>}
      </div>

      <div className="mt-4"><Switch checked={!!f.faol} onChange={set('faol')} label="Faol (foydalanuvchilarga ko'rinadi)" /></div>
    </Card>
  );
}

function NewPlan({ open, onClose, type, typeName, plans, onSaved }) {
  const [f, setF] = useState({ kalit: '', nomi: '', narx: 0, copy: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const { busy, run } = useAction();
  const create = async () => {
    const src = plans.find((p) => String(p.id) === f.copy);
    const body = { action: 'create', botTuri: type, kalit: f.kalit.trim(), nomi: f.nomi.trim(), narx: +f.narx || 0 };
    if (src) Object.assign(body, { features: src.features, maxUsers: src.maxUsers, monthlyMessages: src.monthlyMessages, tezlik: src.tezlik, muddatKun: src.muddatKun, webapp: src.webapp, webappNarx: src.webappNarx });
    if (await run('c', () => api.post('panel/bot_plans', body))) { setF({ kalit: '', nomi: '', narx: 0, copy: '' }); onSaved(); onClose(); }
  };
  return (
    <Modal open={open} onClose={onClose} title={`Yangi tarif — ${typeName}`}
      footer={<><Button onClick={onClose}>Bekor</Button><Button variant="primary" icon={Plus} loading={busy === 'c'} disabled={!f.kalit.trim() || !f.nomi.trim()} onClick={create}>Qo'shish</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomi"><Input value={f.nomi} onChange={set('nomi')} placeholder="Masalan: Biznes" /></Field>
        <Field label="Kalit" hint="Lotin harf, raqam, _ (o'zgarmaydi)"><Input value={f.kalit} onChange={(e) => setF((x) => ({ ...x, kalit: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} placeholder="biznes" /></Field>
        <Field label="Narx (so'm/oy)"><Input type="number" min="0" value={f.narx} onChange={set('narx')} /></Field>
        <Field label="Sozlamalarni nusxalash"><Select value={f.copy} onChange={set('copy')}><option value="">— Bo'sh —</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.nomi}</option>)}</Select></Field>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Copy className="size-3.5" />Yangi tarif yashirin holda qo'shiladi — sozlab, «Faol» ni yoqing.</p>
    </Modal>
  );
}

export default function BotPlans() {
  const { data, error, loading, reload } = useApi('panel/bot_plans');
  const types = useMemo(() => {
    const m = new Map((data?.items || []).map((t) => [t.botTuri, t.typeName]));
    (data?.types || []).forEach((t) => { if (!m.has(t.value)) m.set(t.value, t.label); });
    return [...m.entries()];
  }, [data]);
  const [type, setType] = useState('');
  const [adding, setAdding] = useState(false);
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const cur = type || types[0]?.[0];
  const curName = types.find(([k]) => k === cur)?.[1] || cur;
  const list = data.items.filter((t) => t.botTuri === cur);
  return (
    <div className="animate-in">
      <PageHeader
        title="Bot tariflari"
        description="Har bir shablon turi uchun alohida tariflar: narx, limitlar va qaysi Web App dizaynlari ochiq. Saqlangach shu tarifdagi botlar darhol yangilanadi."
        actions={cur && <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>Yangi tarif</Button>}
      />
      {types.length ? (
        <>
          <Tabs value={cur} onChange={setType} tabs={types.map(([k, n]) => ({ value: k, label: n, count: data.items.filter((t) => t.botTuri === k).length }))} />
          <div className="space-y-6">
            {list.length ? list.map((t) => <PlanForm key={`${t.id}-${JSON.stringify(t.features)}`} t={t} global={data.webappGlobal} onSaved={() => reload(true)} />)
              : <Card><Empty title="Bu turda tarif yo'q" text="«Yangi tarif» tugmasi bilan qo'shing." /></Card>}
          </div>
          <NewPlan open={adding} onClose={() => setAdding(false)} type={cur} typeName={curName} plans={list} onSaved={() => reload(true)} />
        </>
      ) : <Card><Empty title="Bot tariflari topilmadi" text="Migratsiyalarni qo'llang: php tools/migrate.php" /></Card>}
    </div>
  );
}
