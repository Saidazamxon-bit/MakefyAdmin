import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { useAction, useFeedback } from '../components/feedback';
import { Button, Card, Empty, ErrorBox, Input, Loading, PageHeader } from '../components/ui';

export default function Categories() {
  const { data, error, loading, reload } = useApi('panel/categories');
  const [nomi, setNomi] = useState('');
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;
  const add = async (e) => {
    e.preventDefault();
    if (nomi.trim() && await run('add', () => api.post('panel/categories', { action: 'add', nomi }))) { setNomi(''); reload(true); }
  };
  const del = async (c) => {
    if (!(await confirm({ text: `«${c.nomi}» turi o'chirilsinmi?`, danger: true }))) return;
    if (await run(`d${c.id}`, () => api.post('panel/categories', { action: 'delete', id: c.id }))) reload(true);
  };
  return (
    <div className="animate-in">
      <PageHeader title="Bot turlari" description="Kategoriyalar — bot yaratish sahifasidagi filtrlar sifatida ko'rinadi." />
      <ErrorBox error={error} onRetry={reload} />
      <Card>
        <form onSubmit={add} className="mb-5 flex gap-2">
          <Input value={nomi} onChange={(e) => setNomi(e.target.value)} placeholder="Yangi tur nomi, masalan: Do'kon" className="max-w-md" />
          <Button type="submit" variant="primary" icon={Plus} loading={busy === 'add'}>Qo'shish</Button>
        </form>
        {data?.items?.length ? (
          <div className="flex flex-wrap gap-2">
            {data.items.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 py-1 pl-3.5 pr-1.5 text-sm">
                {c.nomi}
                <button type="button" aria-label={`${c.nomi} ni o'chirish`} disabled={busy === `d${c.id}`} onClick={() => del(c)} className="rounded-full p-1 text-muted hover:bg-bad-soft hover:text-bad"><X className="size-3.5" /></button>
              </span>
            ))}
          </div>
        ) : <Empty title="Turlar yo'q" />}
      </Card>
    </div>
  );
}
