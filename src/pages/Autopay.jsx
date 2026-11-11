import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, ExternalLink, Link2, RefreshCw, Smartphone, Wallet, Zap } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useApi } from '../lib/hooks';
import { money, num } from '../lib/format';
import { useAction } from '../components/feedback';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, Pagination, Select, Stat, Switch, Table, Tabs } from '../components/ui';

// Foydalanuvchi botlari uchun karta orqali avto-to'lov (Makefy Pay boti + userbot worker).
const SESS = {
  active: ['Ulangan', 'ok'], new: ['Kod yuborilmoqda', 'warn'], code_sent: ['Kod kutilmoqda', 'warn'], code_ready: ['Kod tekshirilmoqda', 'warn'],
  code_invalid: ["Kod noto'g'ri", 'warn'], need_password: ['2FA parol kutilmoqda', 'warn'], password_ready: ['Parol tekshirilmoqda', 'warn'],
  password_invalid: ["Parol noto'g'ri", 'warn'], logout: ['Uzilmoqda', 'gray'], logged_out: ['Uzilgan', 'gray'], failed: ['Xato', 'bad'], lost: ["Sessiya yo'qolgan", 'bad'],
};
const PST = { credited: ["Balansga o'tdi", 'ok'], paid: ["Pul keldi, o'tmadi", 'bad'], pending: ['Kutilmoqda', 'warn'], expired: ["Muddati o'tdi", 'gray'], cancelled: ['Bekor', 'gray'] };
const pstOf = (p) => (p.credited ? PST.credited : PST[p.status] || [p.status, 'gray']);

function MatchModal({ tx, onClose, onDone }) {
  const [pid, setPid] = useState('');
  const { busy, run } = useAction();
  const save = async () => { if (await run('m', () => api.post('panel/autopay', { action: 'match', tx_id: tx.id, payment_id: Number(pid) }))) { onDone(); onClose(); } };
  return (
    <Modal open onClose={onClose} title="Xabarni to'lovga bog'lash" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" loading={busy === 'm'} onClick={save}>Bog'lash</Button></>}>
      <div className="space-y-4 text-sm">
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-xs">{tx.raw_text}</pre>
        <Field label="To'lov raqami (#)" hint="Summa aynan teng bo'lishi shart. Bog'langach bot foydalanuvchisining balansi to'ldiriladi."><Input type="number" value={pid} onChange={(e) => setPid(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function Setup({ c }) {
  const rows = [
    ['Makefy Pay boti (AUTOPAY_BOT_TOKEN)', c.botToken, c.botUsername ? `@${c.botUsername}` : ".env ga AUTOPAY_BOT_TOKEN qo'shing va api/autopay/setup.php?key=CRON_KEY ni oching"],
    ['Worker sirri (AUTOPAY_WORKER_SECRET)', c.workerSecret, c.workerSecret ? 'Sozlangan' : ".env ga tasodifiy 32+ belgili qiymat qo'shing"],
    ['Userbot worker (VPS)', c.workerOnline, c.workerOnline ? "So'nggi 2 daqiqada bog'langan" : 'userbot/makefy_autopay_worker.py ishga tushirilmagan yoki javob bermayapti'],
    ['Uzcard xabarnoma boti (UZCARD_BOT)', c.uzcard, c.uzcard ? 'Sozlangan' : 'Ixtiyoriy — bo‘sh bo‘lsa faqat Humo', true],
    ['Platforma userboti (Makefy balansi)', c.platformUserbot, c.platformUserbot ? 'Ulangan' : 'Ixtiyoriy — Pay bot → «🏦 Platforma kartasi»', true],
  ];
  return (
    <Card title="Sozlash holati" actions={c.botLink ? <a href={c.botLink} target="_blank" rel="noreferrer"><Button size="sm" icon={ExternalLink}>Pay botni ochish</Button></a> : null}>
      <ul className="divide-y divide-line text-sm">
        {rows.map(([l, ok, hint, optional]) => (
          <li key={l} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <span className="font-medium">{l}</span>
            <span className="flex items-center gap-2"><span className="text-xs text-muted">{hint}</span><Badge tone={ok ? 'ok' : optional ? 'gray' : 'bad'}>{ok ? 'Tayyor' : optional ? 'Ixtiyoriy' : "Yo'q"}</Badge></span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Autopay() {
  const [tab, setTab] = useState('bots');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi(`panel/autopay${qs({ status, page })}`, { interval: 20000 });
  const [modal, setModal] = useState(null);
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const s = data.summary;
  const act = async (key, body) => { if (await run(key, () => api.post('panel/autopay', body))) reload(true); };

  return (
    <div className="animate-in space-y-6">
      <PageHeader title="Avto to'lov (botlar)" description="Foydalanuvchilar o'z botlariga ulagan karta orqali avto-to'lov: Makefy Pay boti, userbot sessiyalari va to'lovlar." actions={<Button icon={RefreshCw} onClick={() => reload(true)}>Yangilash</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ishlayotgan botlar" value={`${num(s.botsLive)} / ${num(s.botsTotal)}`} tone="ok" icon={Bot} />
        <Stat label="Ulangan userbotlar" value={num(s.sessionsActive)} icon={Smartphone} />
        <Stat label="Bugun / shu oy" value={money(s.today)} hint={`Oy: ${money(s.month)}`} tone="ok" icon={Wallet} />
        <Stat label="Balansga o'tmagan" value={num(s.failed)} tone={s.failed ? 'bad' : 'brand'} hint={`Kutilmoqda: ${num(s.pending)}`} icon={Zap} />
      </div>

      <Setup c={data.config} />

      <Card bodyClass="pt-4">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'bots', label: 'Botlar', count: data.bots.length },
          { value: 'sessions', label: 'Userbotlar', count: data.sessions.filter((x) => x.status === 'active').length },
          { value: 'payments', label: "To'lovlar" },
          { value: 'unmatched', label: 'Aniqlanmagan xabarlar', count: data.unmatched.length },
        ]} />

        {tab === 'bots' && (
          <Table rows={data.bots} rowKey="bot" empty={<Empty title="Hali hech kim ulamagan" text="Bot egalari Makefy Pay boti orqali kartasini va userbotini ulaganda shu yerda ko'rinadi." />} columns={[
            { key: 'bot', title: 'Bot', render: (b) => <Link className="font-medium text-brand" to={`/bots/${b.bot}`}>@{b.bot}</Link> },
            { key: 'turi', title: 'Shablon', render: (b) => <Badge tone="info">{b.turi || '—'}</Badge> },
            { key: 'owner', title: 'Egasi', render: (b) => <Link className="text-brand" to={`/users/${b.owner}`}>{b.ownerName || b.owner}</Link> },
            { key: 'card', title: 'Karta', render: (b) => (b.card ? <span className="tabular">{b.card} <span className="text-xs text-muted">{b.cardType}</span></span> : <span className="text-muted">—</span>) },
            { key: 'userbot', title: 'Userbot', render: (b) => <Badge tone={b.userbot ? 'ok' : 'gray'}>{b.userbot ? 'Ulangan' : "Yo'q"}</Badge> },
            { key: 'live', title: 'Holat', render: (b) => <Badge tone={b.live ? 'ok' : b.enabled ? 'warn' : 'gray'}>{b.live ? 'Ishlayapti' : b.enabled ? "Yoqilgan, to'liq emas" : "O'chiq"}</Badge> },
            { key: 'sum', title: 'Jami', align: 'right', render: (b) => <span>{money(b.sum)}<span className="block text-xs text-muted">{num(b.count)} ta · bugun {money(b.todaySum)}</span></span> },
            { key: 'en', title: 'Yoqilgan', render: (b) => <Switch checked={b.enabled} disabled={busy === `b${b.bot}`} onChange={() => act(`b${b.bot}`, { action: 'bot_toggle', bot: b.bot })} /> },
          ]} />
        )}

        {tab === 'sessions' && (
          <Table rows={data.sessions} empty={<Empty title="Userbot ulanmagan" />} columns={[
            { key: 'id', title: '#' },
            { key: 'owner', title: 'Egasi', render: (x) => (x.scope === 'platform' ? <Badge tone="info">Platforma</Badge> : <Link className="text-brand" to={`/users/${x.owner}`}>{x.ownerName || x.owner}</Link>) },
            { key: 'account', title: 'Akkaunt', render: (x) => <span>{x.account || '—'}<span className="block text-xs text-muted tabular">{x.phone}</span></span> },
            { key: 'status', title: 'Holat', render: (x) => { const [l, t] = SESS[x.status] || [x.status, 'gray']; return <span><Badge tone={t}>{l}</Badge>{x.error && <span className="mt-1 block max-w-xs text-xs text-bad">{x.error}</span>}</span>; } },
            { key: 'updated', title: 'Yangilangan', render: (x) => <span className="text-muted">{x.updated}</span> },
            { key: 'act', title: '', align: 'right', render: (x) => (['active', 'new', 'code_sent', 'code_ready', 'code_invalid', 'need_password', 'password_ready', 'password_invalid'].includes(x.status)
              ? <Button size="sm" variant="danger" loading={busy === `s${x.id}`} onClick={() => { if (window.confirm('Userbotni uzasizmi? Shu egasining botlarida avto-to\'lov to\'xtaydi.')) act(`s${x.id}`, { action: 'session_logout', id: x.id }); }}>Uzish</Button> : null) },
          ]} />
        )}

        {tab === 'payments' && (
          <>
            <div className="mb-3 flex justify-end">
              <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-9 w-56">
                <option value="all">Hammasi</option>
                <option value="credited">Balansga o'tgan</option>
                <option value="failed">Pul keldi, balansga o'tmagan</option>
                <option value="pending">Kutilmoqda</option>
                <option value="expired">Muddati o'tgan</option>
                <option value="cancelled">Bekor qilingan</option>
              </Select>
            </div>
            <Table rows={data.payments.items} empty={<Empty title="To'lovlar yo'q" />} columns={[
              { key: 'id', title: '#', render: (p) => <span className="tabular">#{p.id}</span> },
              { key: 'bot', title: 'Bot', render: (p) => <Link className="text-brand" to={`/bots/${p.bot}`}>@{p.bot}</Link> },
              { key: 'end_user', title: 'Foydalanuvchi (Telegram)', render: (p) => <span className="tabular">{p.end_user}{p.purpose && <span className="block text-xs text-muted">{p.purpose}</span>}</span> },
              { key: 'amount', title: 'Summa', align: 'right', render: (p) => <span>{money(p.amount_final)}<span className="block text-xs text-muted">so'ralgan {num(p.amount_req)}</span></span> },
              { key: 'card', title: 'Karta', render: (p) => `•••• ${p.card_last4}` },
              { key: 'status', title: 'Holat', render: (p) => { const [l, t] = pstOf(p); return <span><Badge tone={t}>{l}</Badge>{p.credit_error && !p.credited && <span className="mt-1 block max-w-xs text-xs text-bad">{p.credit_error}</span>}</span>; } },
              { key: 'created', title: 'Sana', render: (p) => <span className="text-muted">{p.created}</span> },
              { key: 'act', title: '', align: 'right', render: (p) => (p.status === 'paid' && !p.credited ? <Button size="sm" loading={busy === `r${p.id}`} onClick={() => act(`r${p.id}`, { action: 'retry_credit', id: p.id })}>Qayta o'tkazish</Button> : null) },
            ]} />
            <Pagination page={page} total={data.payments.total} limit={data.payments.limit} onPage={setPage} />
          </>
        )}

        {tab === 'unmatched' && (
          <Table rows={data.unmatched} empty={<Empty title="Hammasi aniqlangan" text="Userbotlar yuborgan barcha kirim xabarlari to'lovlarga bog'langan." />} columns={[
            { key: 'id', title: '#' },
            { key: 'owner', title: 'Egasi', render: (t) => <Link className="text-brand" to={`/users/${t.owner_uid}`}>{t.owner_uid}</Link> },
            { key: 'amount', title: 'Summa', align: 'right', render: (t) => (t.amount ? money(t.amount) : '—') },
            { key: 'last4', title: 'Karta', render: (t) => (t.last4 ? `•••• ${t.last4}` : '—') },
            { key: 'status', title: 'Holat', render: (t) => <Badge tone="warn">{t.status}</Badge> },
            { key: 'raw', title: 'Xabar', render: (t) => <span className="line-clamp-2 max-w-sm text-xs text-muted">{t.raw_text}</span> },
            { key: 'date', title: 'Sana', render: (t) => <span className="text-muted">{t.date}</span> },
            { key: 'act', title: '', align: 'right', render: (t) => <Button size="sm" icon={Link2} onClick={() => setModal({ type: 'match', tx: t })}>Bog'lash</Button> },
          ]} />
        )}
      </Card>

      {modal?.type === 'match' && <MatchModal tx={modal.tx} onClose={() => setModal(null)} onDone={() => reload(true)} />}
    </div>
  );
}
