import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, Switch, Table } from '../components/ui';

function CreateModal({ onClose, onDone }) {
  const [f, setF] = useState({ kod: '', soni: '100', mukofot_oddiy: '1000', mukofot_pro: '2000', mukofot_premium: '3000', mukofot_max: '5000', shaxsiy_user_id: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const { busy, run } = useAction();
  const gen = () => setF((x) => ({ ...x, kod: `MF${Math.random().toString(36).slice(2, 8).toUpperCase()}` }));
  const save = async () => { if (await run('c', () => api.post('panel/promocodes', { action: 'create', ...f }))) { onDone(); onClose(); } };
  return (
    <Modal open onClose={onClose} title="Yangi promokod" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" loading={busy === 'c'} onClick={save}>Yaratish</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kod" className="sm:col-span-2">
          <div className="flex gap-2"><Input value={f.kod} onChange={set('kod')} placeholder="BAHOR2026" /><Button onClick={gen}>Tasodifiy</Button></div>
        </Field>
        <Field label="Necha marta ishlatiladi"><Input type="number" min="1" value={f.soni} onChange={set('soni')} /></Field>
        <Field label="Shaxsiy (faqat shu ID uchun)" hint="Bo'sh = hamma uchun"><Input value={f.shaxsiy_user_id} onChange={set('shaxsiy_user_id')} /></Field>
        <p className="text-[13px] font-medium sm:col-span-2">Mukofot (so'm) — foydalanuvchi tarifiga qarab</p>
        <Field label="Oddiy"><Input type="number" min="0" value={f.mukofot_oddiy} onChange={set('mukofot_oddiy')} /></Field>
        <Field label="Pro"><Input type="number" min="0" value={f.mukofot_pro} onChange={set('mukofot_pro')} /></Field>
        <Field label="Premium"><Input type="number" min="0" value={f.mukofot_premium} onChange={set('mukofot_premium')} /></Field>
        <Field label="Max"><Input type="number" min="0" value={f.mukofot_max} onChange={set('mukofot_max')} /></Field>
      </div>
    </Modal>
  );
}

export default function Promocodes() {
  const { data, error, loading, reload } = useApi('panel/promocodes');
  const [open, setOpen] = useState(false);
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;
  const act = async (action, p) => {
    if (action === 'delete' && !(await confirm({ text: `«${p.kod}» promokodi o'chirilsinmi?`, danger: true }))) return;
    if (await run(`${action}${p.id}`, () => api.post('panel/promocodes', { action, id: p.id }))) reload(true);
  };
  return (
    <div className="animate-in">
      <PageHeader title="Promokodlar" description="Balansni to'ldiruvchi promokodlar. Mukofot foydalanuvchining tarifiga qarab beriladi." actions={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>Yangi promokod</Button>} />
      <ErrorBox error={error} onRetry={reload} />
      <Card>
        <Table rows={data?.items} empty={<Empty title="Promokodlar yo'q" />} columns={[
          { key: 'kod', title: 'Kod', render: (p) => <code className="rounded bg-surface-2 px-2 py-1 font-semibold">{p.kod}</code> },
          { key: 'use', title: 'Ishlatilgan', render: (p) => (
            <div className="min-w-[120px]">
              <p className="tabular text-sm">{num(p.ishlatilgan)} / {num(p.soni)}</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-brand" style={{ width: `${Math.min(100, (p.ishlatilgan / Math.max(1, p.soni)) * 100)}%` }} /></div>
            </div>
          ) },
          { key: 'm', title: 'Mukofot (O/P/Pr/M)', render: (p) => <span className="tabular text-muted">{[p.mukofot.oddiy, p.mukofot.pro, p.mukofot.premium, p.mukofot.max].map(num).join(' / ')}</span> },
          { key: 'shaxsiy', title: 'Kim uchun', render: (p) => (p.shaxsiy ? <Badge tone="info">ID {p.shaxsiy}</Badge> : <Badge>hamma</Badge>) },
          { key: 'sana', title: 'Yaratilgan', render: (p) => <span className="text-muted">{p.sana}</span> },
          { key: 'faol', title: 'Faol', render: (p) => <Switch checked={p.faol} disabled={busy === `toggle${p.id}`} onChange={() => act('toggle', p)} /> },
          { key: 'del', title: '', align: 'right', render: (p) => <Button size="icon" variant="ghost" aria-label="O'chirish" icon={Trash2} loading={busy === `delete${p.id}`} onClick={() => act('delete', p)} /> },
        ]} />
      </Card>
      {open && <CreateModal onClose={() => setOpen(false)} onDone={() => reload(true)} />}
    </div>
  );
}
