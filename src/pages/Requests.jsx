import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Link2, Plus, Send, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { money } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, Select, Table, Tabs, Textarea } from '../components/ui';

const STATUS = {
  pending: ['Kutilmoqda', 'warn'], approved: ["To'lov kutilmoqda", 'info'], paid: ["To'langan", 'brand'],
  delivered: ['Yetkazildi', 'ok'], rejected: ['Rad etildi', 'bad'], cancelled: ['Bekor qilindi', 'gray'],
  tayyor: ['Tayyor', 'brand'], yuborildi: ['Yuborildi', 'info'], qabul_qilindi: ['Qabul qilindi', 'ok'],
};
const St = ({ s }) => { const [l, t] = STATUS[s] || [s, 'gray']; return <Badge tone={t}>{l}</Badge>; };

function AnswerModal({ req, onClose, onDone }) {
  const [javob, setJavob] = useState('');
  const [pul, setPul] = useState('');
  const { busy, run } = useAction();
  const send = async (status) => {
    if (await run(status, () => api.post('panel/requests', { action: 'answer', id: req.id, status, javob, pul: Number(pul) || 0 }))) { onDone(); onClose(); }
  };
  return (
    <Modal open onClose={onClose} title={`So'rov #${req.sorov_id || req.id}`} wide footer={<>
      <Button icon={X} variant="danger" loading={busy === 'rejected'} onClick={() => send('rejected')}>Rad etish</Button>
      <Button icon={Check} variant="success" loading={busy === 'approved'} onClick={() => send('approved')}>Qabul qilish</Button>
    </>}>
      <div className="space-y-4">
        <div className="rounded-lg bg-surface-2 p-3 text-sm">
          <p className="font-medium">{req.nomi}</p>
          <p className="mt-1 whitespace-pre-wrap text-muted">{req.tavsif || 'Tavsif yo‘q'}</p>
          <p className="mt-2 text-xs text-muted">Foydalanuvchi: <Link className="text-brand" to={`/users/${req.user_id}`}>{req.owner_name || req.user_id}</Link> · {req.sana}</p>
        </div>
        <Field label="Javob matni" hint="Qabul qilishda majburiy. Rad etishda — sabab (ixtiyoriy).">
          <Textarea rows={5} value={javob} onChange={(e) => setJavob(e.target.value)} placeholder="Botda nimalar bo'lishi, muddat va h.k." />
        </Field>
        <Field label="Bot narxi (so'm)" hint="Faqat qabul qilishda. Foydalanuvchiga chatda «To'lov qilish» tugmasi chiqadi.">
          <Input type="number" min="0" value={pul} onChange={(e) => setPul(e.target.value)} placeholder="150000" />
        </Field>
      </div>
    </Modal>
  );
}

function AttachModal({ init, catalog, onClose, onDone }) {
  const [f, setF] = useState({ sorov_id: init?.sorov_id || '', shablon_kod: catalog[0]?.kod || '', token: '', kunlik_tolov: '', tavsif: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const { busy, run } = useAction();
  const save = async () => { if (await run('a', () => api.post('panel/requests', { action: 'attach', ...f }))) { onDone(); onClose(); } };
  return (
    <Modal open onClose={onClose} title="To'langan so'rovga bot biriktirish" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" icon={Link2} loading={busy === 'a'} onClick={save}>Biriktirish</Button></>}>
      <div className="space-y-4">
        <Field label="So'rov ID"><Input value={f.sorov_id} onChange={set('sorov_id')} placeholder="12345" /></Field>
        <Field label="Katalogdagi bot">
          <Select value={f.shablon_kod} onChange={set('shablon_kod')}>{catalog.map((c) => <option key={c.kod} value={c.kod}>{c.nomi}</option>)}</Select>
        </Field>
        <Field label="Bot tokeni" hint="@BotFather bergan token"><Input value={f.token} onChange={set('token')} placeholder="123456:ABC…" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kunlik to'lov (ixtiyoriy)"><Input type="number" value={f.kunlik_tolov} onChange={set('kunlik_tolov')} /></Field>
        </div>
        <Field label="Tavsif (ixtiyoriy)"><Textarea rows={3} value={f.tavsif} onChange={set('tavsif')} /></Field>
      </div>
    </Modal>
  );
}

function CatalogModal({ onClose, onDone }) {
  const [f, setF] = useState({ nomi: '', turi: '', kunlik: '', tavsif: '', kod: '', sorov_id: '', token: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const { busy, run } = useAction();
  const loadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((t) => setF((x) => ({ ...x, kod: t })));
  };
  const save = async () => { if (await run('c', () => api.post('panel/requests', { action: 'catalog_add', ...f }))) { onDone(); onClose(); } };
  return (
    <Modal open wide onClose={onClose} title="Katalogga maxsus bot qo'shish" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" icon={Plus} loading={busy === 'c'} onClick={save}>Qo'shish</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomi"><Input value={f.nomi} onChange={set('nomi')} placeholder="Kino bot" /></Field>
        <Field label="Turi (fayl nomi)" hint="Bo'sh bo'lsa — nomi bilan bir xil"><Input value={f.turi} onChange={set('turi')} /></Field>
        <Field label="Kunlik to'lov (so'm)"><Input type="number" value={f.kunlik} onChange={set('kunlik')} /></Field>
        <Field label="PHP fayl" hint="Yoki pastga kodni joylang"><Input type="file" accept=".php,.txt" onChange={loadFile} className="pt-2" /></Field>
        <Field label="Tavsif" className="sm:col-span-2"><Textarea rows={2} value={f.tavsif} onChange={set('tavsif')} /></Field>
        <Field label="PHP kod" hint="Kodda API_TOKEN so'zi bo'lishi shart — token o'rniga yoziladi." className="sm:col-span-2">
          <Textarea rows={8} value={f.kod} onChange={set('kod')} className="font-mono text-xs" placeholder="<?php define('API_KEY', 'API_TOKEN'); …" />
        </Field>
        <Field label="So'rov ID (ixtiyoriy)" hint="Darhol biriktirish uchun"><Input value={f.sorov_id} onChange={set('sorov_id')} /></Field>
        <Field label="Bot tokeni (so'rov ID bilan)"><Input value={f.token} onChange={set('token')} /></Field>
      </div>
    </Modal>
  );
}

export default function Requests() {
  const [tab, setTab] = useState('requests');
  const [filter, setFilter] = useState('all');
  const { data, error, loading, reload } = useApi(`panel/requests${filter !== 'all' ? `?status=${filter}` : ''}`, { interval: 45000 });
  const [modal, setModal] = useState(null);
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const c = data.counts || {};
  const pendingOrders = data.orders.filter((o) => o.status === 'tayyor').length;

  const deliver = async (o) => {
    if (!(await confirm(`@${o.bot_user} boti egasiga yuborilsinmi? Foydalanuvchi chatda «Qabul qilish» tugmasini ko'radi.`))) return;
    if (await run(`d${o.id}`, () => api.post('panel/requests', { action: 'deliver', zid: o.id }))) reload(true);
  };
  const delCatalog = async (k) => {
    if (!(await confirm({ text: `«${k.nomi}» katalogdan o'chirilsinmi? Kod fayli ham o'chadi.`, danger: true }))) return;
    if (await run(`k${k.kod}`, () => api.post('panel/requests', { action: 'catalog_delete', nomi: k.nomi }))) reload(true);
  };

  return (
    <div className="animate-in">
      <PageHeader title="So'rovlar va buyurtmalar" description="Maxsus bot so'rovlariga javob berish, to'langan so'rovlarga bot biriktirish va tayyor botni egasiga topshirish." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'requests', label: "So'rovlar", count: c.pending },
        { value: 'orders', label: 'Tayyor botlar', count: pendingOrders },
        { value: 'catalog', label: 'Katalog', count: 0 },
        { value: 'transfers', label: "Egalik o'tkazish", count: 0 },
      ]} />
      <ErrorBox error={error} />

      {tab === 'requests' && (
        <Card
          title="Maxsus bot so'rovlari"
          actions={<>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 w-48">
              <option value="all">Hammasi</option>
              {Object.entries(STATUS).slice(0, 6).map(([k, [l]]) => <option key={k} value={k}>{l}{c[k] ? ` (${c[k]})` : ''}</option>)}
            </Select>
            <Button size="sm" icon={Link2} disabled={!data.catalog.length} onClick={() => setModal({ type: 'attach' })}>Bot biriktirish</Button>
          </>}
        >
          <Table rows={data.requests} empty={<Empty title="So'rovlar yo'q" />} columns={[
            { key: 'id', title: 'ID', render: (r) => <span className="tabular font-medium">#{r.sorov_id || r.id}</span> },
            { key: 'nomi', title: 'So‘rov', render: (r) => <div className="max-w-xs"><p className="truncate font-medium">{r.nomi}</p><p className="truncate text-xs text-muted">{r.tavsif}</p></div> },
            { key: 'user', title: 'Foydalanuvchi', render: (r) => <Link className="text-brand" to={`/users/${r.user_id}`}>{r.owner_name || r.user_id}</Link> },
            { key: 'pul', title: 'Narx', align: 'right', render: (r) => (r.pul_miqdori ? money(r.pul_miqdori) : '—') },
            { key: 'status', title: 'Holat', render: (r) => <St s={r.status} /> },
            { key: 'sana', title: 'Sana', render: (r) => <span className="text-muted">{r.sana}</span> },
            { key: 'act', title: '', align: 'right', render: (r) => (
              r.status === 'pending' ? <Button size="sm" variant="primary" onClick={() => setModal({ type: 'answer', req: r })}>Javob berish</Button>
                : r.status === 'paid' ? <Button size="sm" icon={Link2} onClick={() => setModal({ type: 'attach', req: r })}>Bot biriktirish</Button> : null
            ) },
          ]} />
        </Card>
      )}

      {tab === 'orders' && (
        <Card title="Tayyor botlar" subtitle="So'rovga biriktirilgan botlar. «Egasiga yuborish» — foydalanuvchiga chatda qabul qilish tugmasi boradi.">
          <Table rows={data.orders} empty={<Empty title="Buyurtmalar yo'q" />} columns={[
            { key: 'sorov', title: "So'rov", render: (o) => `#${o.sorov_id || o.iltimos_id}` },
            { key: 'bot_user', title: 'Bot', render: (o) => <span className="font-medium">@{o.bot_user}</span> },
            { key: 'user', title: 'Egasi', render: (o) => <Link className="text-brand" to={`/users/${o.user_id}`}>{o.user_id}</Link> },
            { key: 'kunlik', title: 'Kunlik', align: 'right', render: (o) => money(o.kunlik_tolov) },
            { key: 'status', title: 'Holat', render: (o) => <St s={o.status} /> },
            { key: 'act', title: '', align: 'right', render: (o) => (o.status === 'tayyor' ? <Button size="sm" variant="primary" icon={Send} loading={busy === `d${o.id}`} onClick={() => deliver(o)}>Egasiga yuborish</Button> : null) },
          ]} />
        </Card>
      )}

      {tab === 'catalog' && (
        <Card title="Maxsus botlar katalogi" subtitle="Buyurtma asosida tayyorlangan botlarning kodlari (VisionBuilder/zakaz)." actions={<Button size="sm" variant="primary" icon={Plus} onClick={() => setModal({ type: 'catalog' })}>Qo'shish</Button>}>
          <Table rows={data.catalog} rowKey="kod" empty={<Empty title="Katalog bo'sh" />} columns={[
            { key: 'nomi', title: 'Nomi', render: (k) => <span className="font-medium">{k.nomi}</span> },
            { key: 'turi', title: 'Turi' },
            { key: 'kunlik', title: 'Kunlik', align: 'right', render: (k) => money(k.kunlik) },
            { key: 'bor', title: 'Kod', render: (k) => (k.bor ? <Badge tone="ok">bor</Badge> : <Badge tone="bad">yo'q</Badge>) },
            { key: 'tavsif', title: 'Tavsif', render: (k) => <span className="line-clamp-1 max-w-xs text-muted">{k.tavsif}</span> },
            { key: 'act', title: '', align: 'right', render: (k) => <Button size="icon" variant="ghost" aria-label="O'chirish" icon={Trash2} loading={busy === `k${k.kod}`} onClick={() => delCatalog(k)} /> },
          ]} />
        </Card>
      )}

      {tab === 'transfers' && (
        <Card title="Bot egaligini o'tkazish so'rovlari">
          <Table rows={data.transfers} empty={<Empty title="So'rovlar yo'q" />} columns={[
            { key: 'id', title: '#' },
            { key: 'bot_user', title: 'Bot', render: (t) => `@${t.bot_user}` },
            { key: 'user_id', title: 'Hozirgi egasi', render: (t) => <Link className="text-brand" to={`/users/${t.user_id}`}>{t.user_id}</Link> },
            { key: 'yangi', title: 'Yangi egasi', render: (t) => <Link className="text-brand" to={`/users/${t.yangi_egasi_id}`}>{t.yangi_egasi_id}</Link> },
            { key: 'status', title: 'Holat', render: (t) => <St s={t.status} /> },
            { key: 'sana', title: 'Sana' },
          ]} />
        </Card>
      )}

      {modal?.type === 'answer' && <AnswerModal req={modal.req} onClose={() => setModal(null)} onDone={() => reload(true)} />}
      {modal?.type === 'attach' && <AttachModal init={modal.req} catalog={data.catalog} onClose={() => setModal(null)} onDone={() => reload(true)} />}
      {modal?.type === 'catalog' && <CatalogModal onClose={() => setModal(null)} onDone={() => reload(true)} />}
    </div>
  );
}
