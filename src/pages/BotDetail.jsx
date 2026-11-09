import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, ExternalLink, Pause, Play, RefreshCw, Webhook } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { date, money, num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, ErrorBox, Field, Input, KV, Loading, Modal, PageHeader, Select, Stat } from '../components/ui';
import { BotStatus } from './Bots';

function ExtendModal({ bot, onClose, onDone }) {
  const [days, setDays] = useState('30');
  const { busy, run } = useAction();
  const save = async () => { if (await run('ext', () => api.post('panel/bots', { action: 'extend', bot: bot.username, days: Number(days) }))) { onDone(); onClose(); } };
  return (
    <Modal open onClose={onClose} title="Muddatni o'zgartirish" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" loading={busy === 'ext'} onClick={save}>Saqlash</Button></>}>
      <div className="space-y-4">
        <p className="text-sm text-muted">Hozir qolgan: <b className="text-fg">{bot.daysLeft} kun</b>. Manfiy son kiritilsa muddat qisqaradi.</p>
        <div className="flex flex-wrap gap-2">{[7, 30, 90, 365].map((d) => <Button key={d} size="sm" variant={String(d) === days ? 'soft' : 'secondary'} onClick={() => setDays(String(d))}>+{d} kun</Button>)}</div>
        <Field label="Kunlar"><Input type="number" value={days} onChange={(e) => setDays(e.target.value)} /></Field>
        <p className="text-xs text-muted">Pul yechilmaydi. Bot to'xtatilgan bo'lsa va kun &gt; 0 bo'lsa, avtomatik qayta yoqiladi.</p>
      </div>
    </Modal>
  );
}

export default function BotDetail() {
  const { bot } = useParams();
  const { data, error, loading, reload } = useApi(`panel/bots?bot=${encodeURIComponent(bot)}`);
  const [modal, setModal] = useState(null);
  const [plan, setPlan] = useState('');
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const b = data.bot;
  const inst = data.instance || {};
  const st = inst.stats;

  const act = async (action, extra = {}, ask) => {
    if (ask && !(await confirm(ask))) return;
    if (await run(action, () => api.post('panel/bots', { action, bot: b.username, ...extra }))) reload(true);
  };

  return (
    <div className="animate-in space-y-6">
      <PageHeader
        back={<Link to="/bots" className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" />Botlar</Link>}
        title={<span className="flex flex-wrap items-center gap-2">@{b.username} <BotStatus b={b} /></span>}
        description={b.typeName}
        actions={<>
          <a href={`https://t.me/${b.username}`} target="_blank" rel="noreferrer"><Button icon={ExternalLink}>Telegram</Button></a>
          <Button icon={CalendarPlus} variant="primary" onClick={() => setModal('extend')}>Muddat</Button>
          {b.paused
            ? <Button icon={Play} loading={busy === 'resume'} onClick={() => act('resume')}>Yoqish</Button>
            : <Button icon={Pause} variant="danger" loading={busy === 'pause'} onClick={() => act('pause', {}, { text: "Bot to'xtatilsinmi? Webhook o'chiriladi va bot javob bermay qo'yadi.", danger: true })}>To'xtatish</Button>}
        </>}
      />

      {st && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Foydalanuvchilar" value={num(st.users)} />
          <Stat label="Kontent / mahsulot" value={num(st.items)} tone="info" />
          <Stat label="Buyurtmalar / xabarlar" value={num(st.orders)} tone="ok" />
          <Stat label="Tushum" value={money(st.revenue)} tone="warn" hint={st.pending ? `Kutilayotgan: ${st.pending}` : undefined} />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Asosiy ma'lumotlar">
          <KV items={[
            ['Egasi', data.owner ? <Link className="text-brand" to={`/users/${data.owner.userId}`}>{data.owner.name || data.owner.userId}</Link> : b.ownerId],
            ['Turi', b.typeName],
            ['Tarif', b.plan || '—'],
            ['Qolgan kun', <span className={b.daysLeft <= 0 ? 'text-bad' : ''}>{b.daysLeft}</span>],
            ['Narxi', money(b.price)],
            ['Avto to\'lov', b.autoPay ? 'Yoqilgan' : "O'chiq"],
            ['Web App qo\'shimchasi', b.webappAddon ? 'Bor' : "Yo'q"],
            ['Yaratilgan', b.created],
          ]} />
        </Card>

        <Card title="Tarif va limitlar">
          {data.plans.length ? (
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Select value={plan || b.plan} onChange={(e) => setPlan(e.target.value)} className="sm:flex-1">
                {data.plans.map((p) => <option key={p.kalit} value={p.kalit}>{p.nomi} — {money(p.narx)}/oy</option>)}
              </Select>
              <Button variant="primary" disabled={!plan || plan === b.plan} loading={busy === 'set_plan'} onClick={() => act('set_plan', { plan })}>Tarifni qo'llash</Button>
            </div>
          ) : <p className="mb-4 text-sm text-muted">Bu bot turi uchun tariflar yo'q.</p>}
          {data.limits ? (
            <KV items={Object.entries(data.limits).filter(([, v]) => typeof v !== 'object').slice(0, 10).map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 'ha' : "yo'q") : String(v)])} />
          ) : <p className="text-sm text-muted">limits.json topilmadi.</p>}
        </Card>
      </div>

      {data.template && (
        <Card
          title="Shablon (yagona manba)"
          subtitle="Bot kodi VisionBuilder/shablon_src'dan yig'iladi. Ma'lumotlarga tegilmaydi."
          actions={<>
            <Button size="sm" icon={Webhook} loading={busy === 'telegram'} onClick={() => act('telegram')}>Webhookni tiklash</Button>
            <Button size="sm" variant="primary" icon={RefreshCw} loading={busy === 'sync'} onClick={() => act('sync', { force: !data.template.upToDate ? 0 : 1 })}>{data.template.upToDate ? 'Qayta yig‘ish' : 'Yangilash'}</Button>
          </>}
        >
          <KV items={[
            ['Holat', data.template.upToDate ? <Badge tone="ok">Yangi</Badge> : <Badge tone="warn">Eskirgan</Badge>],
            ['Shablon versiyasi', data.template.version || '—'],
            ['Botdagi versiya', data.template.botVersion || '—'],
            ['Oxirgi yangilanish', date(data.template.synced)],
          ]} />
          {inst.panels && (
            <div className="mt-4 flex flex-wrap gap-2">
              {inst.panels.admin && <a href={inst.panels.admin} target="_blank" rel="noreferrer"><Button size="sm" icon={ExternalLink}>Bot admin paneli</Button></a>}
              {inst.panels.app && <a href={inst.panels.app} target="_blank" rel="noreferrer"><Button size="sm" icon={ExternalLink}>Web App</Button></a>}
            </div>
          )}
        </Card>
      )}

      {modal === 'extend' && <ExtendModal bot={b} onClose={() => setModal(null)} onDone={() => reload(true)} />}
    </div>
  );
}
