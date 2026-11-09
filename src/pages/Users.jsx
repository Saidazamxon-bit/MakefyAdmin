import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi, useDebounced } from '../lib/hooks';
import { qs } from '../lib/api';
import { money, num } from '../lib/format';
import { Avatar, Badge, Card, ErrorBox, Loading, PageHeader, Pagination, SearchInput, Select, Table } from '../components/ui';

export default function Users() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const nav = useNavigate();
  const { data, error, loading, reload } = useApi(`panel/users${qs({ q: dq, filter, sort, page })}`);

  const reset = (fn) => (v) => { fn(v); setPage(1); };

  return (
    <div className="animate-in">
      <PageHeader title="Foydalanuvchilar" description="Qidirish, balansni boshqarish, bloklash, tarif va xabar yuborish." />
      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <SearchInput value={q} onChange={reset(setQ)} placeholder="ID, ism, login, @username yoki email" className="md:flex-1" />
          <Select value={filter} onChange={(e) => reset(setFilter)(e.target.value)} className="md:w-48">
            <option value="all">Hammasi</option>
            <option value="balance">Balansi borlar</option>
            <option value="paid">Pullik tarifdagilar</option>
            <option value="banned">Bloklanganlar</option>
          </Select>
          <Select value={sort} onChange={(e) => reset(setSort)(e.target.value)} className="md:w-48">
            <option value="new">Avval yangilari</option>
            <option value="balance">Balans bo'yicha</option>
            <option value="deposit">Jami kiritgan</option>
            <option value="referrals">Referallar</option>
          </Select>
        </div>
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data ? <Loading /> : (
          <>
            <Table
              rows={data?.items}
              rowKey="userId"
              onRowClick={(u) => nav(`/users/${u.userId}`)}
              columns={[
                { key: 'name', title: 'Foydalanuvchi', render: (u) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.avatar} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.name || '—'}</p>
                      <p className="text-xs text-muted">{u.userId}{u.tgUsername && ` · @${u.tgUsername}`}</p>
                    </div>
                  </div>
                ) },
                { key: 'balance', title: 'Balans', align: 'right', render: (u) => money(u.balance) },
                { key: 'totalDeposit', title: 'Jami kiritgan', align: 'right', render: (u) => money(u.totalDeposit) },
                { key: 'bots', title: 'Botlar', align: 'right', render: (u) => num(u.bots) },
                { key: 'referrals', title: 'Referal', align: 'right', render: (u) => num(u.referrals) },
                { key: 'plan', title: 'Tarif', render: (u) => <Badge tone={u.plan && u.plan !== 'oddiy' ? 'brand' : 'gray'}>{u.plan || 'oddiy'}</Badge> },
                { key: 'status', title: 'Holat', render: (u) => (u.banned ? <Badge tone="bad">Bloklangan</Badge> : <Badge tone="ok">Faol</Badge>) },
                { key: 'lastSeen', title: 'Oxirgi kirish', render: (u) => <span className="text-muted">{u.lastSeen || '—'}</span> },
              ]}
            />
            <Pagination page={page} total={data?.total} limit={data?.limit} onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
