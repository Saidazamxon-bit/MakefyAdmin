import { useEffect, useState } from 'react';
import { BadgePercent, Ban, CalendarPlus, CheckCircle2, Clock, Flame, Plus, Tag, Timer, Trash2, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { money, num } from '../lib/format';
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

/* ------------------------------------------------------------------ AKSIYALAR (vaqtli narx chegirmasi) */
const SALE_HOLAT = { faol: ['Faol', 'ok'], kutilmoqda: ['Boshlanmagan', 'info'], tugagan: ['Tugagan', 'gray'], toxtatilgan: ["To'xtatilgan", 'bad'] };
const pad = (n) => String(n).padStart(2, '0');
const toLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const toServer = (v) => (v ? v.replace('T', ' ') : '');

function SaleModal({ plans, ticketPrice, sale, onClose, onDone }) {
  const edit = !!sale;
  const [f, setF] = useState(() => ({
    turi: sale?.turi || 'tarif', kalit: sale?.kalit || plans[0]?.kalit || '', mode: 'narx', narx: sale ? String(sale.narx) : '', foiz: '30',
    start: '', end: sale ? toLocal(new Date(String(sale.tugash).replace(' ', 'T'))) : toLocal(new Date(Date.now() + 3 * 864e5)), nomi: sale?.nomi || '',
  }));
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const { busy, run } = useAction();
  const base = f.turi === 'chipta' ? Number(ticketPrice) || 0 : Number(plans.find((p) => p.kalit === f.kalit)?.narxi) || 0;
  const narx = f.mode === 'foiz' ? (f.foiz === '' ? null : Math.round(base * (100 - (Number(f.foiz) || 0)) / 100)) : (f.narx === '' ? null : Number(f.narx));
  const invalid = !edit && (narx === null || narx < 0 || narx >= base);
  const pct = base > 0 && narx !== null ? Math.round((1 - narx / base) * 100) : 0;
  const quick = (h) => setF((x) => ({ ...x, end: toLocal(new Date(Date.now() + h * 3600e3)) }));
  const save = async () => {
    const body = edit ? { action: 'sale_extend', id: sale.id, end: toServer(f.end) }
      : { action: 'sale_create', turi: f.turi, kalit: f.turi === 'chipta' ? '' : f.kalit, narx, start: toServer(f.start), end: toServer(f.end), nomi: f.nomi.trim() };
    const r = await run('s', () => api.post('panel/chegirma', body));
    if (r) { onDone(r); onClose(); }
  };
  return (
    <Modal open onClose={onClose} title={edit ? `Aksiya muddati — #${sale.id}` : 'Yangi aksiya'} wide
      footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" disabled={invalid || !f.end} loading={busy === 's'} onClick={save}>{edit ? 'Saqlash' : 'Aksiyani boshlash'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {!edit && (
          <>
            <Field label="Nimaga aksiya">
              <Select value={f.turi} onChange={set('turi')}>
                <option value="tarif">Platforma tarifi</option>
                <option value="chipta">Baraban chiptasi</option>
              </Select>
            </Field>
            {f.turi === 'tarif' ? (
              <Field label="Qaysi tarif">
                <Select value={f.kalit} onChange={set('kalit')}>{plans.map((p) => <option key={p.kalit} value={p.kalit}>{p.nomi} · {money(p.narxi)}</option>)}</Select>
              </Field>
            ) : <Field label="Hozirgi narx"><Input value={money(base)} disabled /></Field>}
            <Field label="Chegirma qanday" className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                <Button variant={f.mode === 'narx' ? 'primary' : 'secondary'} onClick={() => setF((x) => ({ ...x, mode: 'narx' }))}>Yangi narx (so'm)</Button>
                <Button variant={f.mode === 'foiz' ? 'primary' : 'secondary'} onClick={() => setF((x) => ({ ...x, mode: 'foiz' }))}>Foiz (%)</Button>
              </div>
            </Field>
            {f.mode === 'narx'
              ? <Field label="Aksiya narxi (so'm)" hint="0 = bepul"><Input type="number" min="0" value={f.narx} onChange={set('narx')} placeholder={String(Math.round(base * 0.7))} /></Field>
              : <Field label="Chegirma foizi"><Input type="number" min="1" max="100" value={f.foiz} onChange={set('foiz')} /></Field>}
            <div className="rounded-lg border border-line bg-surface-2 p-3">
              <p className="text-xs text-muted">Saytda shunday ko'rinadi</p>
              {narx === null ? <p className="mt-1 text-sm text-muted">Narxni kiriting</p>
                : narx >= base ? <p className="mt-1 text-sm text-bad">Aksiya narxi hozirgidan ({money(base)}) arzon bo‘lsin</p>
                  : <p className="mt-1"><s className="text-muted">{money(base)}</s> <b className="text-lg text-ok">{narx > 0 ? money(narx) : 'Bepul'}</b> <Badge tone="bad">-{pct}%</Badge></p>}
            </div>
            <Field label="Boshlanishi" hint="Bo‘sh = hozirdan"><Input type="datetime-local" value={f.start} onChange={set('start')} /></Field>
          </>
        )}
        <Field label="Tugashi" hint="Saytda «… gacha» va qolgan vaqt (taymer) ko‘rinadi" className={edit ? 'sm:col-span-2' : ''}>
          <Input type="datetime-local" value={f.end} onChange={set('end')} />
          <div className="mt-2 flex flex-wrap gap-2">
            {[[6, '6 soat'], [24, '1 kun'], [72, '3 kun'], [168, '7 kun'], [720, '30 kun']].map(([h, l]) => <Button key={h} size="sm" onClick={() => quick(h)}>{l}</Button>)}
          </div>
        </Field>
        {!edit && <Field label="Nomi (ixtiyoriy)" hint="Masalan: «Bahor aksiyasi» — tarif kartasida chiqadi" className="sm:col-span-2"><Input value={f.nomi} maxLength={80} onChange={set('nomi')} /></Field>}
      </div>
    </Modal>
  );
}

function Sales({ data, reload, setData }) {
  const [modal, setModal] = useState(null);
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  const plans = data?.salePlans || [];
  const rows = data?.sales || [];
  const planName = (k) => plans.find((p) => p.kalit === k)?.nomi || k;
  const act = async (action, s, text) => {
    if (text && !(await confirm({ text, danger: action === 'sale_delete' }))) return;
    const r = await run(`${action}${s.id}`, () => api.post('panel/chegirma', { action, id: s.id }));
    if (r) (setData ? setData(r) : reload(true));
  };
  return (
    <Card title="Aksiyalar — vaqtli narx chegirmasi" subtitle="Tarif yoki baraban chiptasiga vaqtincha arzon narx. Saytda eski narx chizilgan holda, yangi narx va qolgan vaqt bilan chiqadi."
      actions={<Button variant="primary" icon={Flame} onClick={() => setModal({})}>Yangi aksiya</Button>}>
      <Table rows={rows} empty={<Empty icon={Tag} title="Aksiyalar yo'q" text="«Yangi aksiya» bilan tarif yoki chipta narxini vaqtincha tushiring." />} columns={[
        { key: 'nima', title: 'Nimaga', render: (s) => (<div><p className="font-medium">{s.turi === 'chipta' ? 'Baraban chiptasi' : `${planName(s.kalit)} tarifi`}</p>{s.nomi && <p className="text-xs text-warn">{s.nomi}</p>}</div>) },
        { key: 'narx', title: 'Narx', render: (s) => {
          const base = s.turi === 'chipta' ? Number(data?.ticketPrice) || 0 : Number(plans.find((p) => p.kalit === s.kalit)?.narxi) || 0;
          const pct = base > 0 ? Math.round((1 - s.narx / base) * 100) : 0;
          return <span><s className="text-muted">{money(base)}</s> <b className="text-ok">{money(s.narx)}</b> {pct > 0 && <Badge tone="bad">-{pct}%</Badge>}</span>;
        } },
        { key: 'vaqt', title: 'Muddat', render: (s) => (
          <div className="min-w-[160px]">
            {s.holat === 'faol' ? <p className={s.secondsLeft < 86400 ? 'font-medium text-bad' : 'font-medium'}><Timer className="mr-1 inline size-3.5" />{leftText(s.secondsLeft)} qoldi</p>
              : s.holat === 'kutilmoqda' ? <p className="font-medium text-info">{leftText(s.secondsLeft)} dan keyin boshlanadi</p>
                : <Badge tone={SALE_HOLAT[s.holat]?.[1]}>{SALE_HOLAT[s.holat]?.[0]}</Badge>}
            <p className="text-xs text-muted">{String(s.boshlanish).slice(0, 16)} → {String(s.tugash).slice(0, 16)}</p>
          </div>
        ) },
        { key: 'act', title: '', align: 'right', render: (s) => (
          <div className="flex justify-end gap-1">
            <Button size="sm" icon={CalendarPlus} onClick={() => setModal(s)}>Muddat</Button>
            {(s.holat === 'faol' || s.holat === 'kutilmoqda') && <Button size="sm" variant="ghost" icon={Ban} loading={busy === `sale_stop${s.id}`} onClick={() => act('sale_stop', s, 'Aksiya to‘xtatilsinmi? Narx darhol asl holiga qaytadi.')}>To‘xtatish</Button>}
            <Button size="icon" variant="ghost" aria-label="O'chirish" icon={Trash2} loading={busy === `sale_delete${s.id}`} onClick={() => act('sale_delete', s, 'Aksiya butunlay o‘chirilsinmi?')} />
          </div>
        ) },
      ]} />
      {modal && <SaleModal plans={plans} ticketPrice={data?.ticketPrice} sale={modal.id ? modal : null} onClose={() => setModal(null)} onDone={(r) => (setData ? setData(r) : reload(true))} />}
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
      <PageHeader title="Chegirma" description="Aksiyalar — tarif yoki chipta narxini vaqtincha tushirish (saytda eski narx chizilgan holda chiqadi). Kuponlar — shaxsiy chegirma, foydalanuvchi Baraban → «Kuponlarim»dan ishlatadi."
        actions={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>Yangi kupon</Button>} />
      <ErrorBox error={error} onRetry={reload} />
      <div className="mb-4"><Sales data={data} reload={reload} setData={setData} /></div>
      <h2 className="mb-3 mt-6 text-[15px] font-semibold">Kuponlar</h2>
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
