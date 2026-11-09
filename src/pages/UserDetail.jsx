import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Crown, MessageSquare, Minus, Plus, Send, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { date, money, num, signedMoney } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Avatar, Badge, Button, Card, Empty, ErrorBox, Field, Input, KV, Loading, Modal, PageHeader, Select, Switch, Table, Tabs, Textarea } from '../components/ui';

function BalanceModal({ user, sign, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);
  const { busy, run } = useAction();
  const submit = async () => {
    const v = Math.abs(Number(amount));
    if (!v) return;
    const r = await run('bal', () => api.post('panel/users', { action: 'balance', user_id: user.userId, amount: sign * v, reason, notify }));
    if (r) { onDone(); onClose(); }
  };
  return (
    <Modal open onClose={onClose} title={sign > 0 ? "Balansga qo'shish" : 'Balansdan ayirish'}
      footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant={sign > 0 ? 'success' : 'danger'} loading={busy === 'bal'} onClick={submit}>{sign > 0 ? "Qo'shish" : 'Ayirish'}</Button></>}>
      <div className="space-y-4">
        <p className="text-sm text-muted">Joriy balans: <b className="text-fg">{money(user.balance)}</b></p>
        <Field label="Summa (so'm)"><Input type="number" min="1" inputMode="numeric" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" /></Field>
        <Field label="Sabab (jurnalda saqlanadi)"><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Masalan: chek orqali to'lov" /></Field>
        <Switch checked={notify} onChange={setNotify} label="Foydalanuvchiga Telegramda xabar berish" />
      </div>
    </Modal>
  );
}

function MessageModal({ user, onClose }) {
  const [text, setText] = useState('');
  const { busy, run } = useAction();
  const send = async () => { if (text.trim() && await run('msg', () => api.post('panel/users', { action: 'message', user_id: user.userId, text }))) onClose(); };
  return (
    <Modal open onClose={onClose} title="Xabar yuborish" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" icon={Send} loading={busy === 'msg'} onClick={send}>Yuborish</Button></>}>
      <p className="mb-3 text-sm text-muted">Xabar foydalanuvchining WebApp chatiga yoziladi va Telegramda bildirishnoma keladi.</p>
      <Textarea rows={6} autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Xabar matni…" />
    </Modal>
  );
}

function PlanModal({ user, plans, onClose, onDone }) {
  const [plan, setPlan] = useState(user.plan || 'oddiy');
  const [until, setUntil] = useState(user.planUntil || '');
  const { busy, run } = useAction();
  const save = async () => { if (await run('plan', () => api.post('panel/users', { action: 'plan', user_id: user.userId, plan, until }))) { onDone(); onClose(); } };
  return (
    <Modal open onClose={onClose} title="Tarifni o'zgartirish" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" loading={busy === 'plan'} onClick={save}>Saqlash</Button></>}>
      <div className="space-y-4">
        <Field label="Tarif"><Select value={plan} onChange={(e) => setPlan(e.target.value)}>{plans.map((p) => <option key={p.kalit} value={p.kalit}>{p.nomi}</option>)}</Select></Field>
        {plan !== 'oddiy' && <Field label="Amal qilish muddati" hint="Bo'sh qoldirilsa — muddatsiz."><Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} /></Field>}
        <p className="text-xs text-muted">Pul yechilmaydi — tarif admin tomonidan sovg'a sifatida beriladi.</p>
      </div>
    </Modal>
  );
}

export default function UserDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, error, loading, reload } = useApi(`panel/users?id=${encodeURIComponent(id)}`);
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState('bots');
  const { confirm } = useFeedback();
  const { busy, run } = useAction();

  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const u = data.user;

  const toggleBan = async () => {
    if (!(await confirm({ text: u.banned ? `${u.name || u.userId} blokdan chiqarilsinmi?` : `${u.name || u.userId} bloklansinmi? U botdan foydalana olmaydi.`, danger: !u.banned }))) return;
    if (await run('ban', () => api.post('panel/users', { action: 'ban', user_id: u.userId, ban: !u.banned }))) reload(true);
  };

  return (
    <div className="animate-in space-y-6">
      <PageHeader
        back={<Link to="/users" className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" />Foydalanuvchilar</Link>}
        title={<span className="flex items-center gap-3"><Avatar name={u.name} src={u.avatar} size="lg" /><span>{u.name || u.userId}{u.banned && <Badge tone="bad" className="ml-2 align-middle">Bloklangan</Badge>}</span></span>}
        actions={<>
          <Button icon={MessageSquare} onClick={() => nav(`/chat/${u.userId}`)}>Chat{data.chatUnread > 0 && ` (${data.chatUnread})`}</Button>
          <Button icon={Send} onClick={() => setModal('msg')}>Xabar</Button>
          <Button icon={u.banned ? ShieldCheck : Ban} variant={u.banned ? 'secondary' : 'danger'} loading={busy === 'ban'} onClick={toggleBan}>{u.banned ? 'Blokdan chiqarish' : 'Bloklash'}</Button>
        </>}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Balans" className="xl:col-span-1">
          <p className="tabular text-3xl font-semibold">{money(u.balance)}</p>
          <p className="mt-1 text-sm text-muted">Jami kiritgan: {money(u.totalDeposit)}</p>
          <div className="mt-4 flex gap-2">
            <Button variant="success" icon={Plus} onClick={() => setModal('plus')}>Qo'shish</Button>
            <Button icon={Minus} onClick={() => setModal('minus')}>Ayirish</Button>
          </div>
        </Card>
        <Card title="Ma'lumotlar" className="xl:col-span-2" actions={<Button size="sm" icon={Crown} onClick={() => setModal('plan')}>Tarif</Button>}>
          <KV items={[
            ['Telegram ID', <span className="tabular">{u.userId}</span>],
            ['Ommaviy ID', u.publicId ? `#${u.publicId}` : '—'],
            ['Username', u.tgUsername ? <a className="text-brand" href={`https://t.me/${u.tgUsername}`} target="_blank" rel="noreferrer">@{u.tgUsername}</a> : '—'],
            ['Login / email', u.email || u.login || '—'],
            ['Kirish turi', u.authType || '—'],
            ['Tarif', <span>{u.plan || 'oddiy'}{u.planUntil && <span className="text-muted"> · {u.planUntil} gacha</span>}</span>],
            ['Referallar', num(u.referrals)],
            ['Kim taklif qilgan', data.invitedBy ? <Link className="text-brand" to={`/users/${data.invitedBy}`}>{data.invitedBy}</Link> : '—'],
            ['Oxirgi kirish', u.lastSeen || '—'],
            ['Streak', `${num(u.streak)} kun`],
          ]} />
        </Card>
      </div>

      <Card bodyClass="pt-4">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'bots', label: 'Botlar', count: data.bots.length },
          { value: 'log', label: 'Balans tarixi', count: data.balanceLog.length },
          { value: 'pay', label: "Karta to'lovlari", count: data.payments.length },
          { value: 'ref', label: 'Taklif qilganlari', count: data.invited.length },
          { value: 'req', label: "So'rovlar", count: data.requests.length },
        ]} />
        {tab === 'bots' && (
          <Table rows={data.bots} rowKey="id" onRowClick={(b) => nav(`/bots/${b.username}`)} empty={<Empty title="Botlari yo'q" />} columns={[
            { key: 'username', title: 'Bot', render: (b) => <span className="font-medium">@{b.username}</span> },
            { key: 'typeName', title: 'Turi' },
            { key: 'plan', title: 'Tarif', render: (b) => b.plan || '—' },
            { key: 'daysLeft', title: 'Qolgan kun', align: 'right', render: (b) => <Badge tone={b.daysLeft > 3 ? 'ok' : b.daysLeft > 0 ? 'warn' : 'bad'}>{b.daysLeft}</Badge> },
            { key: 'created', title: 'Yaratilgan', render: (b) => <span className="text-muted">{b.created}</span> },
          ]} />
        )}
        {tab === 'log' && (
          <Table rows={data.balanceLog} empty={<Empty title="Yozuvlar yo'q" />} columns={[
            { key: 'sana', title: 'Sana', render: (r) => date(r.sana) },
            { key: 'summa', title: 'Summa', align: 'right', render: (r) => <span className={Number(r.summa) >= 0 ? 'text-ok' : 'text-bad'}>{signedMoney(r.summa)}</span> },
            { key: 'sabab', title: 'Sabab' },
            { key: 'izoh', title: 'Izoh', render: (r) => <span className="text-muted">{r.izoh}</span> },
          ]} />
        )}
        {tab === 'pay' && (
          <Table rows={data.payments} empty={<Empty title="To'lovlar yo'q" />} columns={[
            { key: 'id', title: '#' },
            { key: 'amount_final', title: 'Summa', align: 'right', render: (r) => money(r.amount_final) },
            { key: 'last4', title: 'Karta', render: (r) => `•••• ${r.last4}` },
            { key: 'status', title: 'Holat', render: (r) => <Badge tone={r.status === 'paid' ? 'ok' : r.status === 'pending' ? 'warn' : 'gray'}>{r.status}</Badge> },
            { key: 'paid_at', title: "To'langan", render: (r) => date(r.paid_at) },
          ]} />
        )}
        {tab === 'ref' && (
          <Table rows={data.invited} rowKey="referee_id" onRowClick={(r) => nav(`/users/${r.referee_id}`)} empty={<Empty title="Hech kimni taklif qilmagan" />} columns={[
            { key: 'referee_id', title: 'ID' },
            { key: 'ism', title: 'Ism', render: (r) => r.ism || r.login || '—' },
            { key: 'sana', title: 'Sana' },
            { key: 'bonus_berildi', title: 'Bonus', render: (r) => (r.bonus_berildi && !['0', 'yoq', "yo'q", 'no', 'false'].includes(String(r.bonus_berildi).toLowerCase()) ? <Badge tone="ok">berildi</Badge> : <Badge>yo'q</Badge>) },
          ]} />
        )}
        {tab === 'req' && (
          <Table rows={data.requests} empty={<Empty title="So'rovlar yo'q" />} columns={[
            { key: 'sorov_id', title: 'ID', render: (r) => `#${r.sorov_id || r.id}` },
            { key: 'nomi', title: 'Bot' },
            { key: 'status', title: 'Holat', render: (r) => <Badge>{r.status}</Badge> },
            { key: 'sana', title: 'Sana' },
          ]} />
        )}
      </Card>

      {(modal === 'plus' || modal === 'minus') && <BalanceModal user={u} sign={modal === 'plus' ? 1 : -1} onClose={() => setModal(null)} onDone={() => reload(true)} />}
      {modal === 'msg' && <MessageModal user={u} onClose={() => setModal(null)} />}
      {modal === 'plan' && <PlanModal user={u} plans={data.plans} onClose={() => setModal(null)} onDone={() => reload(true)} />}
    </div>
  );
}
