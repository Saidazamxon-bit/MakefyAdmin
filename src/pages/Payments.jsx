import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Link2, Plus } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useApi } from '../lib/hooks';
import { date, money, num, signedMoney } from '../lib/format';
import { useAction } from '../components/feedback';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, Pagination, Select, Stat, Switch, Table, Tabs } from '../components/ui';

const PST = { paid: ["To'langan", 'ok'], pending: ['Kutilmoqda', 'warn'], expired: ['Muddati o‘tdi', 'gray'], cancelled: ['Bekor', 'gray'] };

function CardModal({ onClose, onDone }) {
  const [f, setF] = useState({ number: '', owner: '', type: 'humo' });
  const { busy, run } = useAction();
  const save = async () => { if (await run('c', () => api.post('panel/payments', { action: 'card_add', ...f }))) { onDone(); onClose(); } };
  return (
    <Modal open onClose={onClose} title="Karta qo'shish" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" loading={busy === 'c'} onClick={save}>Qo'shish</Button></>}>
      <div className="space-y-4">
        <Field label="Karta turi"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="humo">Humo (9860…)</option><option value="uzcard">Uzcard (8600…)</option></Select></Field>
        <Field label="Karta raqami"><Input inputMode="numeric" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} placeholder="9860 0000 0000 0000" /></Field>
        <Field label="Karta egasi"><Input value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} placeholder="ISM FAMILIYA" /></Field>
        <p className="text-xs text-muted">To'lovlar @HUMOcardbot xabarlaridan avtomatik aniqlanadi (karta oxirgi 4 raqami + aniq summa).</p>
      </div>
    </Modal>
  );
}

function MatchModal({ tx, onClose, onDone }) {
  const [pid, setPid] = useState('');
  const { busy, run } = useAction();
  const save = async () => { if (await run('m', () => api.post('panel/payments', { action: 'match', tx_id: tx.id, payment_id: Number(pid) }))) { onDone(); onClose(); } };
  return (
    <Modal open onClose={onClose} title="Tranzaksiyani to'lovga bog'lash" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" loading={busy === 'm'} onClick={save}>Bog'lash</Button></>}>
      <div className="space-y-4 text-sm">
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-xs">{tx.raw_text}</pre>
        <Field label="To'lov so'rovi raqami (#)" hint="Summa aynan teng bo'lishi shart. Bog'langach foydalanuvchi balansi to'ldiriladi."><Input type="number" value={pid} onChange={(e) => setPid(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

export default function Payments() {
  const [tab, setTab] = useState('payments');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi(`panel/payments${qs({ status, page })}`, { interval: 30000 });
  const [modal, setModal] = useState(null);
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const s = data.summary;

  return (
    <div className="animate-in space-y-6">
      <PageHeader title="To'lovlar va kartalar" description="Karta orqali avto-to'lov, qabul qiluvchi kartalar va barcha balans o'zgarishlari." actions={<Button variant="primary" icon={Plus} onClick={() => setModal({ type: 'card' })}>Karta qo'shish</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Bugun" value={money(s.today)} tone="ok" icon={CreditCard} />
        <Stat label="Shu oy" value={money(s.month)} tone="ok" />
        <Stat label="Kutilayotgan to'lovlar" value={num(s.pending)} tone="warn" />
        <Stat label="Avto-to'lov" value={s.autoPay ? 'Yoqilgan' : "O'chiq"} tone={s.autoPay ? 'ok' : 'bad'} hint={s.autoPay ? undefined : 'Faol karta va HUMOCARD_HOOK_SECRET kerak'} />
      </div>

      <Card title="Qabul qiluvchi kartalar">
        <Table rows={data.cards} empty={<Empty title="Karta qo'shilmagan" />} columns={[
          { key: 'number', title: 'Karta', render: (c) => <span className="tabular font-medium">{c.number}</span> },
          { key: 'type', title: 'Turi', render: (c) => <Badge tone="info">{c.type}</Badge> },
          { key: 'owner', title: 'Egasi' },
          { key: 'received', title: 'Qabul qilingan', align: 'right', render: (c) => money(c.received) },
          { key: 'active', title: 'Faol', render: (c) => <Switch checked={c.active} disabled={busy === `t${c.id}`} onChange={async () => { if (await run(`t${c.id}`, () => api.post('panel/payments', { action: 'card_toggle', id: c.id }))) reload(true); }} /> },
        ]} />
      </Card>

      <Card bodyClass="pt-4">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'payments', label: "To'lov so'rovlari" },
          { value: 'unmatched', label: 'Aniqlanmagan tranzaksiyalar', count: data.unmatched.length },
          { value: 'log', label: 'Balans jurnali' },
        ]} />
        {tab === 'payments' && (
          <>
            <div className="mb-3 flex justify-end">
              <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-9 w-48">
                <option value="all">Hammasi</option>{Object.entries(PST).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </div>
            <Table rows={data.payments.items} empty={<Empty title="To'lovlar yo'q" />} columns={[
              { key: 'id', title: '#', render: (p) => <span className="tabular">#{p.id}</span> },
              { key: 'user', title: 'Foydalanuvchi', render: (p) => <Link className="text-brand" to={`/users/${p.user_id}`}>{p.name || p.user_id}</Link> },
              { key: 'amount', title: 'Summa', align: 'right', render: (p) => <span>{money(p.amount_final)}{Number(p.amount_final) !== Number(p.amount_req) && <span className="block text-xs text-muted">so'ralgan {num(p.amount_req)}</span>}</span> },
              { key: 'last4', title: 'Karta', render: (p) => `•••• ${p.last4}` },
              { key: 'status', title: 'Holat', render: (p) => { const [l, t] = PST[p.status] || [p.status, 'gray']; return <Badge tone={t}>{l}</Badge>; } },
              { key: 'created', title: 'Yaratilgan', render: (p) => <span className="text-muted">{p.created}</span> },
              { key: 'paid_at', title: "To'langan", render: (p) => <span className="text-muted">{date(p.paid_at)}</span> },
            ]} />
            <Pagination page={page} total={data.payments.total} limit={data.payments.limit} onPage={setPage} />
          </>
        )}
        {tab === 'unmatched' && (
          <Table rows={data.unmatched} empty={<Empty title="Hammasi aniqlangan" text="Karta xabarlaridan kelgan barcha tranzaksiyalar to'lovlarga bog'langan." />} columns={[
            { key: 'id', title: '#' },
            { key: 'amount', title: 'Summa', align: 'right', render: (t) => (t.amount ? money(t.amount) : '—') },
            { key: 'last4', title: 'Karta', render: (t) => (t.last4 ? `•••• ${t.last4}` : '—') },
            { key: 'status', title: 'Holat', render: (t) => <Badge tone="warn">{t.status}</Badge> },
            { key: 'raw', title: 'Xabar', render: (t) => <span className="line-clamp-2 max-w-sm text-xs text-muted">{t.raw_text}</span> },
            { key: 'act', title: '', align: 'right', render: (t) => <Button size="sm" icon={Link2} onClick={() => setModal({ type: 'match', tx: t })}>Bog'lash</Button> },
          ]} />
        )}
        {tab === 'log' && (
          <Table rows={data.balanceLog} empty={<Empty />} columns={[
            { key: 'sana', title: 'Sana', render: (r) => date(r.sana) },
            { key: 'user', title: 'Foydalanuvchi', render: (r) => <Link className="text-brand" to={`/users/${r.user_id}`}>{r.name || r.user_id}</Link> },
            { key: 'summa', title: 'Summa', align: 'right', render: (r) => <span className={Number(r.summa) >= 0 ? 'text-ok' : 'text-bad'}>{signedMoney(r.summa)}</span> },
            { key: 'sabab', title: 'Sabab', render: (r) => <Badge>{r.sabab}</Badge> },
            { key: 'izoh', title: 'Izoh', render: (r) => <span className="line-clamp-1 max-w-xs text-muted">{r.izoh}</span> },
          ]} />
        )}
      </Card>

      {modal?.type === 'card' && <CardModal onClose={() => setModal(null)} onDone={() => reload(true)} />}
      {modal?.type === 'match' && <MatchModal tx={modal.tx} onClose={() => setModal(null)} onDone={() => reload(true)} />}
    </div>
  );
}
