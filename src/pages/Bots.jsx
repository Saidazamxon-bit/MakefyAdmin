import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi, useDebounced } from '../lib/hooks';
import { qs } from '../lib/api';
import { Badge, Card, ErrorBox, Loading, PageHeader, Pagination, SearchInput, Select, Table, Tabs } from '../components/ui';

export function BotStatus({ b }) {
  if (b.paused) return <Badge tone="bad">To'xtatilgan</Badge>;
  if (b.daysLeft <= 0) return <Badge tone="bad">Muddati tugagan</Badge>;
  if (b.trial) return <Badge tone="info">Sinov</Badge>;
  return <Badge tone="ok">Faol</Badge>;
}

export default function Bots() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const nav = useNavigate();
  const { data, error, loading, reload } = useApi(`panel/bots${qs({ q: dq, type, status, page })}`);

  return (
    <div className="animate-in">
      <PageHeader title="Botlar" description="Platformada yaratilgan barcha botlar: muddat, tarif, shablon versiyasi va boshqaruv." />
      <Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} tabs={[
        { value: 'all', label: 'Hammasi' }, { value: 'active', label: 'Faol' }, { value: 'trial', label: 'Sinov' },
        { value: 'expired', label: 'Muddati tugagan' }, { value: 'paused', label: "To'xtatilgan" },
      ]} />
      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="@bot_username yoki egasining ID'si" className="md:flex-1" />
          <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="md:w-56">
            <option value="">Barcha turlar</option>
            {(data?.types || []).map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data ? <Loading /> : (
          <>
            <Table
              rows={data?.items}
              onRowClick={(b) => nav(`/bots/${b.username}`)}
              columns={[
                { key: 'username', title: 'Bot', render: (b) => <div><p className="font-medium">@{b.username}</p><p className="text-xs text-muted">{b.typeName}</p></div> },
                { key: 'owner', title: 'Egasi', render: (b) => <div><p className="truncate">{b.ownerName || '—'}</p><p className="text-xs text-muted">{b.ownerId}</p></div> },
                { key: 'plan', title: 'Tarif', render: (b) => (b.plan ? <Badge tone="brand">{b.plan}</Badge> : '—') },
                { key: 'daysLeft', title: 'Qolgan kun', align: 'right', render: (b) => <span className={b.daysLeft <= 0 ? 'text-bad' : b.daysLeft <= 3 ? 'text-warn' : ''}>{b.daysLeft}</span> },
                { key: 'status', title: 'Holat', render: (b) => <BotStatus b={b} /> },
                { key: 'created', title: 'Yaratilgan', render: (b) => <span className="text-muted">{b.created}</span> },
              ]}
            />
            <Pagination page={page} total={data?.total} limit={data?.limit} onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
