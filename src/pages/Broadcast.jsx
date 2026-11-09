import { useState } from 'react';
import { FlaskConical, Megaphone } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { date, num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, Empty, ErrorBox, Loading, PageHeader, Table, Textarea } from '../components/ui';

export default function Broadcast() {
  const [text, setText] = useState('');
  const { data, error, loading, reload } = useApi('panel/broadcast', { interval: 8000 });
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;

  const sendAll = async () => {
    if (!text.trim()) return;
    if (!(await confirm({ text: `Xabar ${num(data?.recipients)} ta foydalanuvchiga yuboriladi. Davom etilsinmi?`, ok: 'Yuborish' }))) return;
    if (await run('all', () => api.post('panel/broadcast', { text }))) { setText(''); reload(true); }
  };

  return (
    <div className="animate-in space-y-6">
      <PageHeader title="Xabar yuborish" description="Platforma boti orqali barcha foydalanuvchilarga xabar. Navbat orqali, Telegram limitiga rioya qilgan holda yuboriladi." />
      <ErrorBox error={error} onRetry={reload} />
      <div className="grid gap-6 xl:grid-cols-5">
        <Card title="Yangi xabar" subtitle={`Qabul qiluvchilar: ${num(data?.recipients)} ta (bloklanganlarsiz)`} className="xl:col-span-3">
          <Textarea rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="Xabar matni… (oddiy matn, havolalar avtomatik ishlaydi)" maxLength={4000} />
          <div className="mt-1 text-right text-xs text-muted tabular">{text.length} / 4000</div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button icon={FlaskConical} disabled={!text.trim()} loading={busy === 'test'} onClick={() => run('test', () => api.post('panel/broadcast', { text, test: true }))}>O'zimga sinab ko'rish</Button>
            <Button variant="primary" icon={Megaphone} disabled={!text.trim()} loading={busy === 'all'} onClick={sendAll}>Hammaga yuborish</Button>
          </div>
        </Card>
        <Card title="Qanday ishlaydi" className="xl:col-span-2">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
            <li>Xabarlar navbatga qo'yiladi va soniyasiga ~20 tadan yuboriladi.</li>
            <li>Cron (<code>worker.php</code>) ishlasa — fon rejimida yuboriladi. Cron bo'lmasa, bu sahifa ochiq turganda yuborish davom etadi.</li>
            <li>Botni bloklagan foydalanuvchilarga yuborilmaydi va ular «xato» sifatida hisoblanadi.</li>
            <li>Avval «O'zimga sinab ko'rish» bilan matnni tekshiring.</li>
          </ul>
        </Card>
      </div>
      <Card title="Yuborishlar tarixi">
        <Table rows={data?.batches} empty={<Empty title="Hali xabar yuborilmagan" />} columns={[
          { key: 'id', title: '#' },
          { key: 'created', title: 'Boshlangan', render: (b) => date(b.created) },
          { key: 'progress', title: 'Jarayon', render: (b) => {
            const pct = b.total ? Math.round(((b.sent + b.failed) / b.total) * 100) : 0;
            return (
              <div className="min-w-[180px]">
                <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} /></div>
                <p className="mt-1 text-xs text-muted tabular">{num(b.sent)} yuborildi · {num(b.failed)} xato · {num(b.total)} jami</p>
              </div>
            );
          } },
          { key: 'status', title: 'Holat', render: (b) => (b.status === 'done' ? <Badge tone="ok">Tugadi</Badge> : <Badge tone="info">Yuborilmoqda</Badge>) },
        ]} />
        {data?.history?.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-sm font-medium">Oxirgi matnlar</p>
            <ul className="space-y-2">
              {data.history.slice(0, 5).map((h) => (
                <li key={h.id} className="rounded-lg bg-surface-2 p-3 text-sm">
                  <p className="line-clamp-3 whitespace-pre-wrap">{h.body}</p>
                  <p className="mt-1 text-xs text-muted">{date(h.created_at)} · {num(h.recipients)} ta qabul qiluvchi</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
