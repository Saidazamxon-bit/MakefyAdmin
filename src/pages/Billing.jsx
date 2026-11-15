import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Pause, Play, Plus, Save, Trash2 } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useApi, useDebounced } from '../lib/hooks';
import { date, money, num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, Pagination, SearchInput, Select, Stat, Switch, Table, Tabs, Textarea } from '../components/ui';

/*
 * HAR BIR BOT UCHUN ALOHIDA TARIF TIZIMI (backend: api/panel/billing.php, includes/billing.php)
 * Narx, limit, imkoniyat va bepul davr muddati faqat shu yerdan o'zgaradi — kodda qattiq yozilmagan.
 * Saqlangach barcha botlarning limits.json fayllari darhol yangilanadi.
 */

const LIMITS = [
  ['subscribers', 'Obunachilar'], ['broadcasts_per_day', 'Xabar tarqatish / kun'], ['buttons', "Bo'lim va tugmalar"],
  ['channels', 'Majburiy obuna kanallari'], ['admins', 'Adminlar'],
];
const FEATURES = [
  ['pay_card', "To'lov: Humo/Uzcard"], ['pay_stars', "To'lov: Telegram Stars"], ['pay_click_payme', "To'lov: Click/Payme"],
  ['referral', 'Referal tizimi'], ['promo_codes', 'Promo-kodlar'], ['stats_export', 'Statistika eksporti'], ['api_access', 'Statistika API'],
  ['custom_domain', "Web App'da o'z domeni"], ['branding', '«Makefy bilan» yozuvi'],
];
const STATUS = { active: ['Ishlamoqda', 'ok'], expired: ["To'xtatilgan", 'bad'], paused: ["To'xtatilgan (admin)", 'warn'], none: ["Yo'q", 'gray'] };
const PERIOD = { monthly: 'Oylik', yearly: 'Yillik', free: 'Bepul davr', manual: 'Admin' };
const SOURCE = { balance: 'Balans', admin: 'Admin', free: 'Bepul' };

/* ------------------------------------------------------------------ 1. Tarif kartasi */
function PlanEditor({ p, yearlyMonths = 10, onSaved }) {
  const [f, setF] = useState(() => ({ ...p, limits: { ...p.limits }, features: { ...p.features } }));
  const { busy, run } = useAction();
  const setL = (k) => (e) => setF((x) => ({ ...x, limits: { ...x.limits, [k]: e.target.value } }));
  const setFt = (k) => (v) => setF((x) => ({ ...x, features: { ...x.features, [k]: v } }));
  const save = async () => {
    const body = {
      action: 'save_plan', id: p.id, name: f.name, price_month: +f.price_month || 0, sort_order: +f.sort_order || 0,
      is_active: !!f.is_active, is_popular: !!f.is_popular,
      limits: Object.fromEntries(LIMITS.map(([k]) => [k, +f.limits[k] || 0])), features: f.features, type_limits: p.type_limits,
    };
    if (await run('s', () => api.post('panel/billing', body))) onSaved();
  };
  return (
    <Card
      title={<span className="flex flex-wrap items-center gap-2">{p.name}<Badge tone="brand">{p.code}</Badge>{!f.is_active && <Badge tone="bad">yashirin</Badge>}{f.is_popular && <Badge tone="ok">ko'p tanlanadi</Badge>}</span>}
      subtitle={`${money(p.price_month)} / oy · yillik: ${money(p.price_month * yearlyMonths)} (12 oy o'rniga ${yearlyMonths} oy)`}
      actions={<Button size="sm" variant="primary" icon={Save} loading={busy === 's'} onClick={save}>Saqlash</Button>}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nomi"><Input value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} /></Field>
        <Field label="Narx (so'm / oy)"><Input type="number" min="0" value={f.price_month} onChange={(e) => setF((x) => ({ ...x, price_month: e.target.value }))} /></Field>
        <Field label="Tartib"><Input type="number" min="0" value={f.sort_order} onChange={(e) => setF((x) => ({ ...x, sort_order: e.target.value }))} /></Field>
        <div className="flex flex-col justify-end gap-2 pb-1">
          <Switch checked={!!f.is_active} onChange={(v) => setF((x) => ({ ...x, is_active: v }))} label="Faol (sotuvda)" />
          <Switch checked={!!f.is_popular} onChange={(v) => setF((x) => ({ ...x, is_popular: v }))} label="«Ko'p tanlanadi» belgisi" />
        </div>
      </div>
      <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted">Limitlar (0 = cheksiz)</p>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {LIMITS.map(([k, l]) => <Field key={k} label={l}><Input type="number" min="0" value={f.limits[k] ?? 0} onChange={setL(k)} /></Field>)}
      </div>
      <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted">Imkoniyatlar</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Switch checked disabled label="Web App — har doim ochiq (o'zgarmaydi)" />
        {FEATURES.map(([k, l]) => <Switch key={k} checked={!!f.features[k]} onChange={setFt(k)} label={l} />)}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Statistika">
          <Select value={f.features.stats || 'full'} onChange={(e) => setFt('stats')(e.target.value)}>
            <option value="full">To'liq</option><option value="export">To'liq + eksport</option><option value="api">To'liq + eksport + API</option>
          </Select>
        </Field>
        <Field label="Yordam">
          <Select value={f.features.support || 'chat'} onChange={(e) => setFt('support')(e.target.value)}>
            <option value="chat">Chat</option><option value="fast">Tezkor</option><option value="personal">Shaxsiy</option>
          </Select>
        </Field>
      </div>
    </Card>
  );
}

function NewPlan({ open, onClose, onSaved }) {
  const [f, setF] = useState({ code: '', name: '' });
  const { busy, run } = useAction();
  const create = async () => { if (await run('c', () => api.post('panel/billing', { action: 'create_plan', ...f }))) { setF({ code: '', name: '' }); onSaved(); onClose(); } };
  return (
    <Modal open={open} onClose={onClose} title="Yangi tarif"
      footer={<><Button onClick={onClose}>Bekor</Button><Button variant="primary" icon={Plus} loading={busy === 'c'} disabled={!f.code || !f.name} onClick={create}>Qo'shish</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomi"><Input value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} placeholder="Masalan: Korporativ" /></Field>
        <Field label="Kod" hint="lotin harf, raqam, _ (o'zgarmaydi)"><Input value={f.code} onChange={(e) => setF((x) => ({ ...x, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} placeholder="korporativ" /></Field>
      </div>
      <p className="mt-3 text-xs text-muted">Yangi tarif yashirin holda qo'shiladi: narx va limitlarni kiritib, «Faol» ni yoqing.</p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ 2. Bot turiga xos limitlar (matritsa) */
function TypeLimits({ data, onSaved }) {
  const plans = data.plans;
  const [units, setUnits] = useState(() => ({ ...(data.settings.type_units || {}) }));
  const [m, setM] = useState(() => Object.fromEntries(plans.map((p) => [p.code, JSON.parse(JSON.stringify(p.type_limits || {}))])));
  const [nt, setNt] = useState({ type: '', key: '', label: '' });
  const { busy, run } = useAction();
  const types = Object.keys(units);
  const val = (pc, t) => m[pc]?.[t]?.[units[t]?.key] ?? '';
  const setVal = (pc, t, v) => setM((x) => ({ ...x, [pc]: { ...x[pc], [t]: { [units[t].key]: v === '' ? 0 : +v } } }));
  const save = async () => {
    const ok = await run('u', async () => {
      await api.post('panel/billing', { action: 'save_type_units', type_units: units });
      for (const p of plans) {
        // birlik kaliti o'zgargan bo'lsa ham to'g'ri saqlanishi uchun qiymatlar joriy kalit bilan qayta yoziladi
        const tl = {};
        for (const t of types) tl[t] = { [units[t].key]: +(m[p.code]?.[t] ? Object.values(m[p.code][t])[0] : 0) || 0 };
        await api.post('panel/billing', { action: 'save_plan', id: p.id, name: p.name, price_month: p.price_month, sort_order: p.sort_order, is_active: p.is_active, is_popular: p.is_popular, limits: p.limits, features: p.features, type_limits: tl });
      }
      return { message: 'Bot turi limitlari saqlandi — barcha botlar yangilandi.' };
    });
    if (ok) onSaved();
  };
  const addType = () => {
    const t = nt.type.trim().toLowerCase();
    if (!/^[a-z0-9_]{2,32}$/.test(t) || !/^[a-z0-9_]{1,32}$/.test(nt.key) || !nt.label.trim()) return;
    setUnits((u) => ({ ...u, [t]: { key: nt.key, label: nt.label.trim() } }));
    setNt({ type: '', key: '', label: '' });
  };
  return (
    <Card
      title="Bot turiga xos limit"
      subtitle="Har bir bot turining asosiy kontent birligi (kino, mahsulot, dars…). 0 = cheksiz. Yangi bot turi uchun faqat qator qo'shish kifoya."
      actions={<Button size="sm" variant="primary" icon={Save} loading={busy === 'u'} onClick={save}>Hammasini saqlash</Button>}
    >
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 sm:pl-5">Bot turi</th><th className="px-2 py-2.5">Birlik kaliti</th><th className="px-2 py-2.5">Yorliq</th>
              {plans.map((p) => <th key={p.code} className="px-2 py-2.5">{p.name}</th>)}
              <th className="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t} className="border-b border-line last:border-0">
                <td className="px-4 py-2 sm:pl-5"><div className="font-medium">{data.bot_types?.[t] || t}</div><div className="text-xs text-muted">{t}</div></td>
                <td className="px-2 py-2"><Input className="w-28" value={units[t].key} onChange={(e) => setUnits((u) => ({ ...u, [t]: { ...u[t], key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') } }))} /></td>
                <td className="px-2 py-2"><Input className="w-40" value={units[t].label} onChange={(e) => setUnits((u) => ({ ...u, [t]: { ...u[t], label: e.target.value } }))} /></td>
                {plans.map((p) => (
                  <td key={p.code} className="px-2 py-2"><Input className="w-24" type="number" min="0" value={val(p.code, t)} onChange={(e) => setVal(p.code, t, e.target.value)} /></td>
                ))}
                <td className="px-2 py-2"><Button size="icon" variant="ghost" icon={Trash2} aria-label="Olib tashlash" title="Bu turda turga xos limit bo'lmaydi" onClick={() => setUnits((u) => { const c = { ...u }; delete c[t]; return c; })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 rounded-xl border border-line bg-surface-2/50 p-4 sm:grid-cols-4">
        <Field label="Yangi bot turi (kalit)"><Input value={nt.type} onChange={(e) => setNt((x) => ({ ...x, type: e.target.value }))} placeholder="masalan: lotereya" /></Field>
        <Field label="Birlik kaliti"><Input value={nt.key} onChange={(e) => setNt((x) => ({ ...x, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} placeholder="tickets" /></Field>
        <Field label="Yorliq"><Input value={nt.label} onChange={(e) => setNt((x) => ({ ...x, label: e.target.value }))} placeholder="Chiptalar" /></Field>
        <div className="flex items-end"><Button icon={Plus} onClick={addType}>Qator qo'shish</Button></div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ 3. Sozlamalar */
function SettingsForm({ data, onSaved }) {
  const s = data.settings;
  const [f, setF] = useState(() => ({ ...s, reminder_days: (s.reminder_days || []).join(', ') }));
  const { busy, run } = useAction();
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = async () => {
    const body = {
      action: 'save_settings', free_period_days: +f.free_period_days, free_period_plan: f.free_period_plan, yearly_paid_months: +f.yearly_paid_months,
      multi_bot_min: +f.multi_bot_min, multi_bot_discount_pct: +f.multi_bot_discount_pct, referral_pct: +f.referral_pct,
      reminder_days: String(f.reminder_days).split(/[\s,]+/).map(Number).filter(Boolean), unpaid_reminder_every_days: +f.unpaid_reminder_every_days || 0,
      delete_after_days: +(f.delete_after_days ?? 7),
      month_days: +f.month_days, year_days: +f.year_days, paused_text: f.paused_text,
    };
    if (await run('s', () => api.post('panel/billing', body))) onSaved();
  };
  return (
    <Card title="Umumiy sozlamalar" subtitle="Bepul davr, chegirmalar, referal va eslatmalar" actions={<Button size="sm" variant="primary" icon={Save} loading={busy === 's'} onClick={save}>Saqlash</Button>}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Bepul davr (kun)" hint="Birinchi bot uchun, akkauntga bir marta. 0 = o'chiq"><Input type="number" min="0" value={f.free_period_days} onChange={set('free_period_days')} /></Field>
        <Field label="Bepul davr tarifi"><Select value={f.free_period_plan} onChange={set('free_period_plan')}>{data.plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</Select></Field>
        <Field label="Yillik to'lov: necha oy narxi" hint="10 = 12 oy o'rniga 10 oy (−17%)"><Input type="number" min="1" max="12" value={f.yearly_paid_months} onChange={set('yearly_paid_months')} /></Field>
        <Field label="Ko'p bot chegirmasi: botlar soni" hint="Shuncha va undan ortiq pullik botda"><Input type="number" min="0" value={f.multi_bot_min} onChange={set('multi_bot_min')} /></Field>
        <Field label="Ko'p bot chegirmasi (%)"><Input type="number" min="0" max="90" value={f.multi_bot_discount_pct} onChange={set('multi_bot_discount_pct')} /></Field>
        <Field label="Platforma referali (%)" hint="Do'st tarif sotib olsa — taklif qilganga"><Input type="number" min="0" max="90" value={f.referral_pct} onChange={set('referral_pct')} /></Field>
        <Field label="Eslatma kunlari" hint="Muddat tugashiga necha kun qolganda, vergul bilan"><Input value={f.reminder_days} onChange={set('reminder_days')} /></Field>
        <Field label="To'lanmasa o'chirish (kun)" hint="Muddat tugagach shuncha kun ichida to'lanmasa bot butunlay o'chiriladi. Har kuni ogohlantiriladi. 0 = o'chirmaslik"><Input type="number" min="0" max="90" value={f.delete_after_days ?? 7} onChange={set('delete_after_days')} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="1 oy (kun)"><Input type="number" min="28" max="31" value={f.month_days} onChange={set('month_days')} /></Field>
          <Field label="1 yil (kun)"><Input type="number" min="360" max="366" value={f.year_days} onChange={set('year_days')} /></Field>
        </div>
        <Field label="To'xtatilgan bot xabari" hint="Muddat tugaganda bot foydalanuvchilariga ko'rinadi" className="sm:col-span-2 lg:col-span-3">
          <Textarea rows={2} value={f.paused_text} onChange={set('paused_text')} />
        </Field>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ 4. Botlar (obunalar) */
function GrantModal({ bot, plans, onClose, onSaved }) {
  const [f, setF] = useState({ plan: bot?.plan || plans[0]?.code, days: 30, note: '', extend: true });
  const { busy, run } = useAction();
  useEffect(() => { if (bot) setF({ plan: bot.plan || plans[0]?.code, days: 30, note: '', extend: true }); }, [bot, plans]);
  if (!bot) return null;
  const go = async () => { if (await run('g', () => api.post('panel/billing', { action: 'grant', bot: bot.bot, ...f, days: +f.days }))) { onSaved(); onClose(); } };
  return (
    <Modal open onClose={onClose} title={`@${bot.bot} — tarif yoki muddat berish`}
      footer={<><Button onClick={onClose}>Bekor</Button><Button variant="primary" icon={CalendarPlus} loading={busy === 'g'} onClick={go}>Berish</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tarif"><Select value={f.plan} onChange={(e) => setF((x) => ({ ...x, plan: e.target.value }))}>{plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</Select></Field>
        <Field label="Kunlar"><Input type="number" min="1" max="3650" value={f.days} onChange={(e) => setF((x) => ({ ...x, days: e.target.value }))} /></Field>
        <Field label="Izoh" className="sm:col-span-2"><Input value={f.note} onChange={(e) => setF((x) => ({ ...x, note: e.target.value }))} placeholder="Masalan: kompensatsiya" /></Field>
        <div className="sm:col-span-2"><Switch checked={f.extend} onChange={(v) => setF((x) => ({ ...x, extend: v }))} label="Shu tarif faol bo'lsa — joriy muddat oxiridan uzaytirish" /></div>
      </div>
      <p className="mt-3 text-xs text-muted">To'lovsiz beriladi va «To'lovlar» ro'yxatida «Admin» bo'lib ko'rinadi. Bot to'xtatilgan bo'lsa — darhol ishga tushadi.</p>
    </Modal>
  );
}

function BotsTab({ plans }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, error, loading, reload } = useApi(`panel/billing${qs({ view: 'bots', q: dq, status, plan, page })}`);
  const [grant, setGrant] = useState(null);
  const { run } = useAction();
  const { confirm } = useFeedback();
  const setSt = async (r, st) => {
    if (st === 'paused' && !(await confirm({ text: `@${r.bot} to'xtatilsinmi? Foydalanuvchilar «Bot vaqtincha ishlamayapti» xabarini ko'radi. Ma'lumotlar o'chirilmaydi.`, danger: true }))) return;
    if (await run('st', () => api.post('panel/billing', { action: 'set_status', bot: r.bot, status: st }))) reload(true);
  };
  return (
    <Card>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px_200px]">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Bot yoki egasi ID…" className="min-w-[220px] flex-1" />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-auto"><option value="">Barcha holatlar</option><option value="active">Ishlamoqda</option><option value="free">Bepul davr</option><option value="expired">To'xtatilgan</option><option value="paused">Admin to'xtatgan</option></Select>
        <Select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }} className="w-auto"><option value="">Barcha tariflar</option>{plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</Select>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? <Loading /> : (
        <>
          <Table
            rows={data?.rows || []}
            rowKey="bot_id"
            empty={<Empty title="Bot topilmadi" />}
            columns={[
              { key: 'bot', title: 'Bot', render: (r) => <div><div className="font-medium">@{r.bot}</div><div className="text-xs text-muted">{r.type} · egasi {r.user_id}</div></div> },
              { key: 'plan', title: 'Tarif', render: (r) => <span className="flex items-center gap-1.5">{r.plan_name}{r.is_free_period && <Badge tone="brand">bepul</Badge>}</span> },
              { key: 'status', title: 'Holat', render: (r) => <Badge tone={STATUS[r.status]?.[1]}>{STATUS[r.status]?.[0] || r.status}</Badge> },
              { key: 'exp', title: 'Muddat', render: (r) => <div className="tabular"><div>{date(r.expires_at)}</div><div className={r.delete_in_days != null ? 'text-xs text-bad' : 'text-xs text-muted'}>{r.status === 'active' ? `${r.days_left} kun qoldi` : r.delete_in_days != null ? (r.delete_in_days <= 1 ? "ertaga o'chiriladi" : `${r.delete_in_days} kundan keyin o'chiriladi`) : PERIOD[r.period] || r.period}</div></div> },
              { key: 'act', title: '', align: 'right', render: (r) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" icon={CalendarPlus} onClick={() => setGrant(r)}>Berish</Button>
                  {r.status === 'paused'
                    ? <Button size="sm" variant="ghost" icon={Play} title="Yoqish" onClick={() => setSt(r, 'active')} />
                    : <Button size="sm" variant="ghost" icon={Pause} title="To'xtatish" onClick={() => setSt(r, 'paused')} />}
                </div>
              ) },
            ]}
          />
          <Pagination page={page} total={data?.total || 0} limit={data?.limit || 25} onPage={setPage} />
        </>
      )}
      <GrantModal bot={grant} plans={plans} onClose={() => setGrant(null)} onSaved={() => reload(true)} />
    </Card>
  );
}

/* ------------------------------------------------------------------ 5. To'lovlar */
function PaymentsTab({ plans }) {
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, error, loading, reload } = useApi(`panel/billing${qs({ view: 'payments', q: dq, source, page })}`);
  const pname = (c) => plans.find((p) => p.code === c)?.name || c;
  return (
    <Card title="Tarif to'lovlari" subtitle={data ? `${num(data.total)} ta · jami ${money(data.sum)}` : ''}>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px]">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Bot, egasi yoki promo-kod…" className="min-w-[220px] flex-1" />
        <Select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className="w-auto"><option value="">Barcha manbalar</option><option value="balance">Balansdan</option><option value="admin">Admin bergan</option><option value="free">Bepul davr</option></Select>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? <Loading /> : (
        <>
          <Table
            dense
            rows={data?.rows || []}
            empty={<Empty title="To'lov yo'q" />}
            columns={[
              { key: 'created_at', title: 'Sana', render: (r) => <span className="tabular">{date(r.created_at)}</span> },
              { key: 'bot', title: 'Bot', render: (r) => <div><div className="font-medium">@{r.bot}</div><div className="text-xs text-muted">{r.user_id}</div></div> },
              { key: 'plan', title: 'Tarif', render: (r) => <span>{pname(r.plan)} · {PERIOD[r.period] || r.period}{r.period === 'monthly' && r.months > 1 ? ` × ${r.months}` : ''}</span> },
              { key: 'disc', title: 'Chegirma', render: (r) => (r.multi_discount + r.promo_discount > 0 ? <span className="text-xs">{r.multi_discount > 0 && `3+ bot −${num(r.multi_discount)} `}{r.promo_discount > 0 && `${r.promo_code} −${num(r.promo_discount)}`}</span> : '—') },
              { key: 'source', title: 'Manba', render: (r) => <Badge tone={r.source === 'balance' ? 'ok' : r.source === 'admin' ? 'warn' : 'gray'}>{SOURCE[r.source] || r.source}</Badge> },
              { key: 'amount', title: 'Summa', align: 'right', render: (r) => money(r.amount) },
            ]}
          />
          <Pagination page={page} total={data?.total || 0} limit={data?.limit || 25} onPage={setPage} />
        </>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ 6. Promo-kodlar */
function PromoTab({ plans }) {
  const { data, error, loading, reload } = useApi('panel/billing?view=promo');
  const [f, setF] = useState(null);
  const { busy, run } = useAction();
  const { confirm } = useFeedback();
  const empty = { code: '', discount_pct: 10, discount_amount: 0, plan_codes: '', max_uses: 0, per_user_once: true, valid_until: '', is_active: true };
  const save = async () => { if (await run('p', () => api.post('panel/billing', { action: 'promo_save', ...f }))) { setF(null); reload(true); } };
  const del = async (r) => { if (await confirm({ text: `${r.code} o'chirilsinmi?`, danger: true }) && await run('d', () => api.post('panel/billing', { action: 'promo_delete', id: r.id }))) reload(true); };
  return (
    <Card title="Tarif promo-kodlari" subtitle="Bot tarifini sotib olishda chegirma" actions={<Button size="sm" variant="primary" icon={Plus} onClick={() => setF(empty)}>Yangi kod</Button>}>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? <Loading /> : (
        <Table
          rows={data?.rows || []}
          empty={<Empty title="Promo-kod yo'q" />}
          columns={[
            { key: 'code', title: 'Kod', render: (r) => <span className="font-mono font-medium">{r.code}</span> },
            { key: 'disc', title: 'Chegirma', render: (r) => (+r.discount_pct > 0 ? `${r.discount_pct}%` : money(r.discount_amount)) },
            { key: 'plans', title: 'Tariflar', render: (r) => r.plan_codes || 'hammasi' },
            { key: 'uses', title: 'Ishlatilgan', render: (r) => <span className="tabular">{num(r.used_count)}{+r.max_uses > 0 ? ` / ${num(r.max_uses)}` : ''}</span> },
            { key: 'until', title: 'Muddat', render: (r) => (r.valid_until ? date(r.valid_until) : '—') },
            { key: 'st', title: 'Holat', render: (r) => <Badge tone={+r.is_active ? 'ok' : 'gray'}>{+r.is_active ? 'faol' : "o'chiq"}</Badge> },
            { key: 'a', title: '', align: 'right', render: (r) => (
              <div className="flex justify-end gap-1">
                <Button size="sm" onClick={() => setF({ ...r, per_user_once: !!+r.per_user_once, is_active: !!+r.is_active, valid_until: r.valid_until ? String(r.valid_until).slice(0, 10) : '' })}>Tahrirlash</Button>
                <Button size="icon" variant="ghost" icon={Trash2} aria-label="O'chirish" loading={busy === 'd'} onClick={() => del(r)} />
              </div>
            ) },
          ]}
        />
      )}
      <Modal open={!!f} onClose={() => setF(null)} title={f?.id ? `${f.code} — tahrirlash` : 'Yangi promo-kod'}
        footer={<><Button onClick={() => setF(null)}>Bekor</Button><Button variant="primary" loading={busy === 'p'} onClick={save}>Saqlash</Button></>}>
        {f && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kod"><Input value={f.code} onChange={(e) => setF((x) => ({ ...x, code: e.target.value.toUpperCase() }))} placeholder="BAHOR25" /></Field>
            <Field label="Muddat (gacha)"><Input type="date" value={f.valid_until} onChange={(e) => setF((x) => ({ ...x, valid_until: e.target.value }))} /></Field>
            <Field label="Chegirma (%)" hint="Yoki summani kiriting"><Input type="number" min="0" max="100" value={f.discount_pct} onChange={(e) => setF((x) => ({ ...x, discount_pct: e.target.value }))} /></Field>
            <Field label="Chegirma (so'm)"><Input type="number" min="0" value={f.discount_amount} onChange={(e) => setF((x) => ({ ...x, discount_amount: e.target.value }))} /></Field>
            <Field label="Tariflar" hint={`Vergul bilan: ${plans.map((p) => p.code).join(', ')}. Bo'sh = hammasi`}><Input value={f.plan_codes} onChange={(e) => setF((x) => ({ ...x, plan_codes: e.target.value }))} /></Field>
            <Field label="Maks. ishlatish" hint="0 = cheksiz"><Input type="number" min="0" value={f.max_uses} onChange={(e) => setF((x) => ({ ...x, max_uses: e.target.value }))} /></Field>
            <Switch checked={!!f.per_user_once} onChange={(v) => setF((x) => ({ ...x, per_user_once: v }))} label="Har foydalanuvchiga bir marta" />
            <Switch checked={!!f.is_active} onChange={(v) => setF((x) => ({ ...x, is_active: v }))} label="Faol" />
          </div>
        )}
      </Modal>
    </Card>
  );
}

/* ------------------------------------------------------------------ sahifa */
export default function Billing() {
  const { data, error, loading, reload } = useApi('panel/billing');
  const [tab, setTab] = useState('plans');
  const [adding, setAdding] = useState(false);
  const plans = useMemo(() => data?.plans || [], [data]);
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const st = data.stats || {};
  const activeTotal = Object.values(st.by_plan || {}).reduce((a, b) => a + (b.active || 0), 0);
  const freeTotal = Object.values(st.by_plan || {}).reduce((a, b) => a + (b.free || 0), 0);
  const key = JSON.stringify(plans) + JSON.stringify(data.settings);
  return (
    <div className="animate-in">
      <PageHeader
        title="Bot tariflari"
        description="Tarif har bir botga alohida: Start, Pro, Biznes, Premium. Narx, limitlar va bepul davr muddati shu yerda; saqlangach barcha botlar darhol yangilanadi."
        actions={tab === 'plans' && <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>Yangi tarif</Button>}
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Faol botlar" value={num(activeTotal)} hint={`${num(freeTotal)} tasi bepul davrda`} />
        <Stat label="To'xtatilgan" value={num((st.expired || 0) + (st.paused || 0))} hint={`${data.settings.delete_after_days || 0} kun ichida to'lanmasa o'chiriladi`} tone="warn" />
        <Stat label="Tushum (shu oy)" value={money(st.revenue_month)} hint={`Jami: ${money(st.revenue_total)}`} tone="ok" />
        <Stat label="Referal to'lovlari" value={money(st.referral_paid)} hint={`${data.settings.referral_pct}% har to'lovdan`} />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'plans', label: 'Tariflar', count: plans.length },
        { value: 'types', label: 'Bot turi limitlari', count: Object.keys(data.settings.type_units || {}).length },
        { value: 'settings', label: 'Sozlamalar' },
        { value: 'bots', label: 'Botlar' },
        { value: 'payments', label: "To'lovlar" },
        { value: 'promo', label: 'Promo-kodlar' },
      ]} />
      {tab === 'plans' && (
        <div className="space-y-6">
          {plans.map((p) => <PlanEditor key={`${p.id}-${JSON.stringify(p)}`} p={p} yearlyMonths={+data.settings.yearly_paid_months || 10} onSaved={() => reload(true)} />)}
          <NewPlan open={adding} onClose={() => setAdding(false)} onSaved={() => reload(true)} />
        </div>
      )}
      {tab === 'types' && <TypeLimits key={key} data={data} onSaved={() => reload(true)} />}
      {tab === 'settings' && <SettingsForm key={key} data={data} onSaved={() => reload(true)} />}
      {tab === 'bots' && <BotsTab plans={plans} />}
      {tab === 'payments' && <PaymentsTab plans={plans} />}
      {tab === 'promo' && <PromoTab plans={plans} />}
    </div>
  );
}
