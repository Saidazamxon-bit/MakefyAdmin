import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bot, CreditCard, MessageSquare, PackageCheck, RefreshCw, Users, Wallet } from 'lucide-react';
import { useApi } from '../lib/hooks';
import { money, num, ago, shortDay } from '../lib/format';
import { Avatar, Badge, Button, Card, ErrorBox, Loading, PageHeader, Stat, Table, Tabs } from '../components/ui';
import { BarChart, Bars } from '../components/Charts';

function Alert({ to, icon: Icon, children, tone = 'warn' }) {
  const cls = tone === 'bad' ? 'border-bad/30 bg-bad-soft text-bad' : 'border-warn/30 bg-warn-soft text-warn';
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition hover:opacity-90 ${cls}`}>
      <Icon className="size-4 shrink-0" /><span className="flex-1">{children}</span><span aria-hidden>→</span>
    </Link>
  );
}

export default function Dashboard() {
  const { data, error, loading, reload } = useApi('panel/dashboard', { interval: 60000 });
  const [rank, setRank] = useState('balance');
  const nav = useNavigate();
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const s = data.stats;

  return (
    <div className="animate-in space-y-6">
      <PageHeader
        title="Boshqaruv paneli"
        description="Platformaning umumiy holati. Ma'lumotlar har daqiqada yangilanadi."
        actions={<Button icon={RefreshCw} onClick={() => reload()}>Yangilash</Button>}
      />
      <ErrorBox error={error} />

      {(s.requestsPending > 0 || s.chatUnread > 0 || data.templates.outdated > 0 || s.requestsPaid > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {s.requestsPending > 0 && <Alert to="/requests" icon={PackageCheck}>{s.requestsPending} ta maxsus bot so'rovi javob kutmoqda</Alert>}
          {s.requestsPaid > 0 && <Alert to="/requests" icon={CreditCard}>{s.requestsPaid} ta to'langan so'rovga bot biriktirish kerak</Alert>}
          {s.chatUnread > 0 && <Alert to="/chat" icon={MessageSquare}>{s.chatUnread} ta suhbatda o'qilmagan xabar bor</Alert>}
          {data.templates.outdated > 0 && <Alert to="/templates" icon={AlertTriangle}>{data.templates.outdated} ta bot shablonning eski versiyasida</Alert>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Foydalanuvchilar" value={num(s.users)} hint={`Bugun kirgan: ${num(s.usersToday)} · Bloklangan: ${num(s.banned)}`} icon={Users} />
        <Stat label="Botlar" value={num(s.bots)} hint={`Faol: ${num(s.botsActive)} · To'xtagan: ${num(s.botsPaused)}`} icon={Bot} tone="info" />
        <Stat label="To'lovlar (30 kun)" value={money(s.payments30)} hint={`Bugun: ${money(s.paymentsToday)}`} icon={CreditCard} tone="ok" />
        <Stat label="Jami balanslar" value={money(s.balance)} hint={`Navbatda xabar: ${num(s.jobsPending)}`} icon={Wallet} tone="warn" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Yangi botlar" subtitle="Oxirgi 14 kun" className="xl:col-span-2">
          <BarChart data={data.series.map((d) => ({ label: shortDay(d.date), value: d.bots }))} format={(v) => `${v} ta`} />
        </Card>
        <Card title="Bot turlari" subtitle="Yaratilgan botlar soni">
          {data.types.length ? <Bars items={data.types.slice(0, 7).map((t) => ({ label: t.name, value: t.count }))} format={num} /> : <p className="text-sm text-muted">Hali bot yo'q.</p>}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Karta orqali to'lovlar" subtitle="Oxirgi 14 kun, so'm" className="xl:col-span-2">
          <BarChart tone="ok" data={data.series.map((d) => ({ label: shortDay(d.date), value: d.payments }))} format={money} />
        </Card>
        <Card title="Reyting" bodyClass="pt-3">
          <Tabs value={rank} onChange={setRank} tabs={[{ value: 'balance', label: 'Balans' }, { value: 'referrals', label: 'Referal' }, { value: 'bots', label: 'Botlar' }]} />
          <ol className="space-y-1">
            {(data.top[rank] || []).map((u, i) => (
              <li key={u.userId + i}>
                <Link to={`/users/${u.userId}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                  <span className="tabular w-5 text-xs text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{u.name || u.userId}</span>
                  <span className="tabular font-medium">{rank === 'balance' ? money(u.balance) : `${num(u.count)} ta`}</span>
                </Link>
              </li>
            ))}
            {!(data.top[rank] || []).length && <li className="py-6 text-center text-sm text-muted">Ma'lumot yo'q</li>}
          </ol>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Yangi foydalanuvchilar" actions={<Link to="/users" className="text-sm font-medium text-brand">Hammasi →</Link>}>
          <Table
            dense
            rows={data.recentUsers}
            rowKey="userId"
            onRowClick={(u) => nav(`/users/${u.userId}`)}
            columns={[
              { key: 'name', title: 'Foydalanuvchi', render: (u) => (
                <div className="flex items-center gap-2.5"><Avatar name={u.name} src={u.avatar} size="sm" /><div className="min-w-0"><p className="truncate font-medium">{u.name || '—'}</p><p className="text-xs text-muted">{u.userId}</p></div></div>
              ) },
              { key: 'balance', title: 'Balans', align: 'right', render: (u) => money(u.balance) },
              { key: 'plan', title: 'Tarif', render: (u) => <Badge tone={u.plan && u.plan !== 'oddiy' ? 'brand' : 'gray'}>{u.plan || 'oddiy'}</Badge> },
            ]}
          />
        </Card>
        <Card title="So'nggi hodisalar" actions={<Link to="/security" className="text-sm font-medium text-brand">Loglar →</Link>}>
          <ul className="divide-y divide-line text-sm">
            {data.events.map((e) => (
              <li key={e.id} className="flex items-start gap-3 py-2.5">
                <Badge tone={/fail|xato|invalid/i.test(e.event) ? 'bad' : e.event.startsWith('panel_') ? 'brand' : 'gray'}>{e.event}</Badge>
                <span className="min-w-0 flex-1 break-words text-muted">{e.message}</span>
                <span className="whitespace-nowrap text-xs text-muted">{ago(e.created_at)}</span>
              </li>
            ))}
            {!data.events.length && <li className="py-6 text-center text-muted">Hodisalar yo'q</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
