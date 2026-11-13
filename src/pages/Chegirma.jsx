import { useEffect, useState } from 'react';
import { BadgePercent, Ban, CalendarPlus, CheckCircle2, Clock, Plus, Timer, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, SearchInput, Select, Stat, Table, Tabs } from '../components/ui';

/*
 * Chegirma kuponlari (backend: api/panel/chegirma.php, includes/baraban.php → mf_baraban_coupons).
 * Admin kupon yaratadi (bitta foydalanuvchiga yoki hammaga), muddatini belgilaydi/uzaytiradi, bekor qiladi.
 * Barabanda yutilgan kuponlar ham shu yerda ko'rinadi; ularning amal qilish muddati — «Sozlamalar»da.
 * Foydalanuvchi kuponni saytdagi Baraban → «Kuponlarim» bo'limidan ishlatadi.
 */
const HOLAT = { faol: ['Faol', 'ok'], ishlatilgan: ['Ishlatilgan', 'info'], tugagan: ['Muddati tugagan', 'gray'] };

/** Qolgan vaqt: «12 kun 4 soat», «5 soat 20 daqiqa», «18 daqiqa» */
export function leftText(sec) {
  const s = Math.max(0, Math.floor(sec));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d} kun${h ? ` ${h} soat` : ''}`;
  if (h > 0) return `${h} soat${m ? ` ${m} daqiqa` : ''}`;
  return `${Math.max(1, m)} daqiqa`;
}

function CreateModal({ scopes, defDays, onClose, onDone }) {
  const [f, setF] = useState({ who: 'one', target: '', scope: 'tarif', foiz: '20', days: String(defDays || 30), nomi: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const { busy, run } = useAction();
  const { confirm } = useFeedback();
  const foiz = Number(f.foiz) || 0;
  const auto = foiz >= 100 ? 'Bepul' : `${foiz}% chegirma`;
  const save = async () => {
    if (f.who === 'all' && !(await confirm({ text: `Barcha foydalanuvchilarga «${f.nomi || auto}» kuponi berilsinmi?` }))) return;
    const r = await run('c', () => api.post('panel/chegirma', {
      action: 'create', target: f.who === 'all' ? 'all' : f.target.trim(), scope: f.scope, foiz, days: Number(f.days), nomi: f.nomi.trim(),
    }));
    if (r) { onDone(r); onClose(); }
  };
  return (
    <Modal open onClose={onClose} title="Yangi chegirma" wide
      footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" loading={busy === 'c'} onClick={save}>Yaratish</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kimga" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Button variant={f.who === 'one' ? 'primary' : 'secondary'} onClick={() => setF((x) => ({ ...x, who: 'one' }))}>Bitta foydalanuvchiga</Button>
            <Button variant={f.who === 'all' ? 'primary' : 'secondary'} icon={Users} onClick={() => setF((x) => ({ ...x, who: 'all' }))}>Barcha foydalanuvchilarga</Button>
          </div>
        </Field>
        {f.who === 'one' && (
          <Field label="Foydalanuvchi ID" hint="«Foydalanuvchilar» bo‘limidagi ID" className="sm:col-span-2">
            <Input value={f.target} inputMode="numeric" onChange={(e) => setF((x) => ({ ...x, target: e.target.value.replace(/\D/g, '') }))} placeholder="7919670157" />
          </Field>
        )}
        <Field label="Chegirma nimaga">
          <Select value={f.scope} onChange={set('scope')}>{Object.entries(scopes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        </Field>
        <Field label="Chegirma foizi" hint="100 = bepul"><Input type="number" min="1" max="100" value={f.foiz} onChange={set('foiz')} /></Field>
        <Field label="Amal qilish muddati (kun)" hint="Foydalanuvchiga qolgan vaqt ko‘rsatiladi">
          <div className="flex flex-wrap gap-2">
            <Input type="number" min="1" max="365" value={f.days} onChange={set('days')} className="w-28" />
            {[1, 3, 7, 14, 30].map((d) => <Button key={d} size="sm" variant={Number(f.days) === d ? 'primary' : 'secondary'} onClick={() => setF((x) => ({ ...x, days: String(d) }))}>{d} kun</Button>)}
          </div>
        </Field>
        <Field label="Nomi (ixtiyoriy)" hint={`Bo‘sh bo‘lsa: «${auto}»`}><Input value={f.nomi} maxLength={80} onChange={set('nomi')} placeholder={auto} /></Field>
      </div>
    </Modal>
  );
}

function ExtendModal({ coupon, onClose, onDone }) {
  const [days, setDays] = useState('7');
  const { busy, run } = useAction();
  const save = async () => { const r = await run('e', () => api.post('panel/chegirma', { action: 'extend', id: coupon.id, days: Number(days) })); if (r) { onDone(r); onClose(); } };
  return (
    <Modal open onClose={onClose} title={`Muddatni uzaytirish — #${coupon.id}`}
      footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" loading={busy === 'e'} onClick={save}>Uzaytirish</Button></>}>
      <p className="mb-3 text-sm text-muted">{coupon.nomi} · hozir: {coupon.holat === 'faol' ? `${leftText(coupon.secondsLeft)} qoldi` : 'muddati tugagan (hozirdan hisoblanadi)'}</p>
      <Field label="Necha kun qo‘shilsin">
        <div className="flex flex-wrap gap-2">
          <Input type="number" min="1" max="365" value={days} onChange={(e) => setDays(e.target.value)} className="w-28" />
          {[1, 3, 7, 14, 30].map((d) => <Button key={d} size="sm" variant={Number(days) === d ? 'primary' : 'secondary'} onClick={() => setDays(String(d))}>+{d}</Button>)}
        </div>
      </Field>
    </Modal>
  );
}

function SettingsCard({ s, onSaved }) {
  const [days, setDays] = useState(String(s?.couponDays ?? 30));
  useEffect(() => { setDays(String(s?.couponDays ?? 30)); }, [s?.couponDays]);
  const { busy, run } = useAction();
  const dirty = Number(days) !== Number(s?.couponDays);
  const save = async () => { const r = await run('st', () => api.post('panel/chegirma', { action: 'settings', couponDays: Number(days) })); if (r) onSaved(r); };
  return (
    <Card title="Barabanda yutilgan kuponlar" subtitle="Yangi yutilgan kupon necha kun amal qiladi (eski kuponlarga ta’sir qilmaydi)"
      actions={<Button variant={dirty ? 'primary' : 'secondary'} disabled={!dirty} loading={busy === 'st'} onClick={save}>Saqlash</Button>}>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Amal qilish muddati (kun)"><Input type="number" min="1" max="365" value={days} onChange={(e) => setDays(e.target.value)} className="w-28" /></Field>
        {[7, 14, 30, 60].map((d) => <Button key={d} size="sm" variant={Number(days) === d ? 'primary' : 'secondary'} onClick={() => setDays(String(d))}>{d} kun</Button>)}
      </div>
    </Card>
  );
}

export default function Chegirma() {
  const [holat, setHolat] = useState('faol');
  const [q, setQ] = useState('');
  const [qq, setQq] = useState('');
  useEffect(() => { const t = setTimeout(() => setQq(q.trim()), 350); return () => clearTimeout(t); }, [q]);
  const path = `panel/chegirma?holat=${holat}${qq ? `&q=${encodeURIComponent(qq)}` : ''}`;
  const { data, error, loading, reload, setData } = useApi(path);
  const [open, setOpen] = useState(false);
  const [ext, setExt] = useState(null);
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;
  const st = data?.stats || {};
  const scopes = data?.scopes || {};
  const applied = (r) => (setData ? setData(r) : reload(true));
  const cancel = async (c) => {
    if (!(await confirm({ text: `«${c.nomi}» kuponi bekor qilinsinmi? Foydalanuvchi uni ishlata olmaydi.`, danger: true }))) return;
    const r = await run(`x${c.id}`, () => api.post('panel/chegirma', { action: 'cancel', id: c.id }));
    if (r) reload(true);
  };
  return (
    <div className="animate-in">
      <PageHeader title="Chegirma" description="Chegirma kuponlari: akkaunt tarifiga, bot to'loviga yoki bot shabloniga. Foydalanuvchi ularni Baraban → «Kuponlarim»dan ishlatadi."
        actions={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>Yangi chegirma</Button>} />
      <ErrorBox error={error} onRetry={reload} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Faol kuponlar" value={num(st.faol)} icon={BadgePercent} tone="ok" />
        <Stat label="Ishlatilgan" value={num(st.used)} icon={CheckCircle2} tone="info" />
        <Stat label="Muddati tugagan" value={num(st.expired)} icon={Clock} tone="gray" />
        <Stat label="Admin bergan" value={num(st.admin)} icon={Users} tone="brand" />
      </div>
      <div className="mb-4"><SettingsCard s={data?.settings} onSaved={() => reload(true)} /></div>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Tabs value={holat} onChange={setHolat} tabs={[
            { value: 'faol', label: 'Faol', count: st.faol }, { value: 'ishlatilgan', label: 'Ishlatilgan' },
            { value: 'tugagan', label: 'Tugagan' }, { value: '', label: 'Hammasi' },
          ]} />
          <SearchInput value={q} onChange={setQ} placeholder="Foydalanuvchi ID yoki nom" className="w-full sm:w-64" />
        </div>
        <Table rows={data?.coupons} empty={<Empty icon={BadgePercent} title="Kuponlar yo'q" text="«Yangi chegirma» tugmasi bilan yarating." />} columns={[
          { key: 'foiz', title: 'Chegirma', render: (c) => <span className="text-base font-semibold text-brand">{c.foiz >= 100 ? 'Bepul' : `-${c.foiz}%`}</span> },
          { key: 'nomi', title: 'Nomi', render: (c) => (<div><p className="font-medium">{c.nomi}</p><p className="text-xs text-muted">{scopes[c.scope] || c.scope}</p></div>) },
          { key: 'user', title: 'Foydalanuvchi', render: (c) => (<div><p className="tabular">{c.user_id}</p>{c.ism && <p className="text-xs text-muted">{c.ism}</p>}</div>) },
          { key: 'manba', title: 'Manba', render: (c) => (c.manba === 'admin' ? <Badge tone="brand">Admin</Badge> : <Badge tone="warn">Baraban</Badge>) },
          { key: 'vaqt', title: 'Muddat', render: (c) => (
            <div className="min-w-[140px]">
              {c.holat === 'faol'
                ? <p className={c.secondsLeft < 86400 ? 'font-medium text-bad' : 'font-medium'}><Timer className="mr-1 inline size-3.5" />{leftText(c.secondsLeft)} qoldi</p>
                : <Badge tone={HOLAT[c.holat]?.[1]}>{HOLAT[c.holat]?.[0]}</Badge>}
              <p className="text-xs text-muted">{c.used_at ? `Ishlatildi: ${String(c.used_at).slice(0, 16)}${c.used_for ? ` · ${c.used_for}` : ''}` : `${String(c.expires_at).slice(0, 16)} gacha`}</p>
            </div>
          ) },
          { key: 'act', title: '', align: 'right', render: (c) => (c.holat === 'ishlatilgan' ? null : (
            <div className="flex justify-end gap-1">
              <Button size="sm" icon={CalendarPlus} onClick={() => setExt(c)}>Uzaytirish</Button>
              {c.holat === 'faol' && <Button size="sm" variant="ghost" icon={Ban} loading={busy === `x${c.id}`} onClick={() => cancel(c)}>Bekor</Button>}
            </div>
          )) },
        ]} />
      </Card>
      {open && <CreateModal scopes={scopes} defDays={data?.settings?.couponDays} onClose={() => setOpen(false)} onDone={applied} />}
      {ext && <ExtendModal coupon={ext} onClose={() => setExt(null)} onDone={applied} />}
    </div>
  );
}
