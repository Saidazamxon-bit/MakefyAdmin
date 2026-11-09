import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useApi, useDebounced } from '../lib/hooks';
import { date, num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, ErrorBox, KV, Loading, PageHeader, Pagination, SearchInput, Select, Table } from '../components/ui';

export default function Security() {
  const [event, setEvent] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, error, loading, reload } = useApi(`panel/security${qs({ event, q: dq, page })}`);
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const s = data.system;

  const backfill = async () => {
    if (!(await confirm("Barcha botlarning limits.json fayli joriy tarif bo'yicha qayta yoziladi. Pul/balansga tegilmaydi. Davom etilsinmi?"))) return;
    run('bf', () => api.post('panel/security', { action: 'limits_backfill' }));
  };

  return (
    <div className="animate-in space-y-6">
      <PageHeader title="Xavfsizlik va loglar" description="Kirishlar, admin amallari va tizim holati. Admin paneldagi har bir amal shu yerda qayd etiladi." />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Tizim" className="xl:col-span-2">
          <KV items={[
            ['Server vaqti', s.time], ['PHP', s.php],
            ['Navbatdagi xabarlar', num(s.jobsPending)], ['Xato (24 soat)', num(s.jobsFailed24h)],
            ['Shablon avto-tarqatish', s.templateAutoSync ? <Badge tone="ok">yoqilgan</Badge> : <Badge tone="warn">o'chiq</Badge>],
            ['Frontend', s.frontendUrl || '—'], ['Admin panel URL', s.adminPanelUrl || <Badge tone="warn">ADMIN_PANEL_URL yo'q</Badge>],
            ['error.log hajmi', `${num(s.errorLogSize / 1024)} KB`],
          ]} />
        </Card>
        <Card title="Vositalar">
          <p className="mb-3 text-sm text-muted">Bot limitlarini (foydalanuvchi soni, xabarlar, Web App) joriy tarif bo'yicha qayta yozish.</p>
          <Button icon={Wrench} loading={busy === 'bf'} onClick={backfill}>Limitlarni tiklash</Button>
        </Card>
      </div>

      <Card title="Xavfsizlik jurnali">
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Matn, IP yoki foydalanuvchi ID" className="md:flex-1" />
          <Select value={event} onChange={(e) => { setEvent(e.target.value); setPage(1); }} className="md:w-64">
            <option value="">Barcha hodisalar</option>
            <option value="panel">Admin panel amallari</option>
            {data.events.map((e) => <option key={e.event} value={e.event}>{e.event} ({e.n})</option>)}
          </Select>
        </div>
        <Table dense rows={data.items} columns={[
          { key: 'created_at', title: 'Vaqt', render: (r) => <span className="whitespace-nowrap text-muted">{date(r.created_at)}</span> },
          { key: 'event', title: 'Hodisa', render: (r) => <Badge tone={/fail|invalid|xato/i.test(r.event) ? 'bad' : r.event.startsWith('panel_') ? 'brand' : 'gray'}>{r.event}</Badge> },
          { key: 'message', title: 'Tafsilot', render: (r) => <span className="break-words">{r.message}</span> },
          { key: 'user_id', title: 'Foydalanuvchi', render: (r) => r.user_id || '—' },
          { key: 'ip', title: 'IP', render: (r) => <span className="tabular text-muted">{r.ip}</span> },
        ]} />
        <Pagination page={page} total={data.total} limit={data.limit} onPage={setPage} />
      </Card>

      {data.errorLog?.length > 0 && (
        <Card title="Server xatolari (error.log oxiri)">
          <pre className="max-h-96 overflow-auto rounded-lg bg-surface-2 p-3 text-xs leading-relaxed">{data.errorLog.join('\n')}</pre>
        </Card>
      )}
    </div>
  );
}
