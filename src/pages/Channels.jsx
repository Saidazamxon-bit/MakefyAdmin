import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { money, num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Button, Card, Empty, ErrorBox, Field, Input, Loading, PageHeader, Table } from '../components/ui';

export default function Channels() {
  const { data, error, loading, reload } = useApi('panel/channels');
  const [f, setF] = useState({ nomi: '', username: '', mukofot: '' });
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;

  const add = async (e) => {
    e.preventDefault();
    if (await run('add', () => api.post('panel/channels', { action: 'add', ...f }))) { setF({ nomi: '', username: '', mukofot: '' }); reload(true); }
  };
  const del = async (c) => {
    if (!(await confirm({ text: `«${c.nomi}» kanali o'chirilsinmi? Bajarilganlar tarixi ham o'chadi.`, danger: true }))) return;
    if (await run(`d${c.id}`, () => api.post('panel/channels', { action: 'delete', id: c.id }))) reload(true);
  };

  return (
    <div className="animate-in space-y-6">
      <PageHeader title="Pul ishlash kanallari" description="Foydalanuvchi kanalga obuna bo'lsa, balansiga mukofot tushadi («Pul ishlash» bo'limi)." />
      <ErrorBox error={error} onRetry={reload} />
      <Card title="Kanal qo'shish">
        <form onSubmit={add} className="grid items-end gap-4 md:grid-cols-[1fr_1fr_160px_auto]">
          <Field label="Nomi"><Input value={f.nomi} onChange={(e) => setF({ ...f, nomi: e.target.value })} placeholder="Makefy yangiliklari" /></Field>
          <Field label="Username yoki ID"><Input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} placeholder="@kanal" /></Field>
          <Field label="Mukofot (so'm)"><Input type="number" min="0" value={f.mukofot} onChange={(e) => setF({ ...f, mukofot: e.target.value })} /></Field>
          <Button type="submit" variant="primary" icon={Plus} loading={busy === 'add'}>Qo'shish</Button>
        </form>
      </Card>
      <Card title="Kanallar">
        <Table rows={data?.items} empty={<Empty title="Kanallar yo'q" />} columns={[
          { key: 'nomi', title: 'Nomi', render: (c) => <span className="font-medium">{c.nomi}</span> },
          { key: 'username', title: 'Kanal', render: (c) => (c.username.startsWith('@') ? <a className="text-brand" href={`https://t.me/${c.username.slice(1)}`} target="_blank" rel="noreferrer">{c.username}</a> : c.username) },
          { key: 'mukofot', title: 'Mukofot', align: 'right', render: (c) => money(c.mukofot) },
          { key: 'done', title: 'Bajarganlar', align: 'right', render: (c) => num(c.done) },
          { key: 'sana', title: "Qo'shilgan", render: (c) => <span className="text-muted">{c.sana}</span> },
          { key: 'del', title: '', align: 'right', render: (c) => <Button size="icon" variant="ghost" aria-label="O'chirish" icon={Trash2} loading={busy === `d${c.id}`} onClick={() => del(c)} /> },
        ]} />
      </Card>
    </div>
  );
}
