import { useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { num } from '../lib/format';
import { useAction } from '../components/feedback';
import { Badge, Button, Card, ErrorBox, Field, Input, Loading, PageHeader, Switch } from '../components/ui';

function PlanCard({ p, onSaved }) {
  const [f, setF] = useState(p);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const { busy, run } = useAction();
  const save = async () => { if (await run('s', () => api.post('panel/plans', { action: 'save_plan', ...f }))) onSaved(); };
  return (
    <Card title={<span className="flex items-center gap-2">{p.nomi}<Badge tone="brand">{p.kalit}</Badge></span>} subtitle={`${num(p.users)} ta faol obunachi`} actions={<Button size="sm" variant="primary" loading={busy === 's'} onClick={save}>Saqlash</Button>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Narxi (so'm)"><Input type="number" min="0" value={f.narxi} onChange={set('narxi')} /></Field>
        <Field label="Muddati (kun)"><Input type="number" min="1" value={f.muddat_kun} onChange={set('muddat_kun')} /></Field>
        <Field label="Botlarga chegirma (%)"><Input type="number" min="0" max="100" value={f.chegirma} onChange={set('chegirma')} /></Field>
        <Field label="Kunlik bonusga qo'shimcha (%)"><Input type="number" min="0" value={f.kunlik_bonus_foiz} onChange={set('kunlik_bonus_foiz')} /></Field>
        <Field label="Referal bonusiga qo'shimcha (%)"><Input type="number" min="0" value={f.referal_bonus_foiz} onChange={set('referal_bonus_foiz')} /></Field>
        <Field label="Yangi botga bonus kun"><Input type="number" min="0" value={f.bot_bonus_kun} onChange={set('bot_bonus_kun')} /></Field>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Switch checked={f.otkazish} onChange={set('otkazish')} label="Botni boshqaga o'tkazish" />
        <Switch checked={f.chat_rasm} onChange={set('chat_rasm')} label="Chatda rasm yuborish" />
        <Switch checked={f.token_yangila} onChange={set('token_yangila')} label="Bot tokenini almashtirish" />
        <Switch checked={f.webapp_bepul} onChange={set('webapp_bepul')} label="Web App qo'shimchasi bepul" />
      </div>
    </Card>
  );
}

function LimitRow({ l, onSaved }) {
  const [f, setF] = useState(l);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const { busy, run } = useAction();
  const save = async () => { if (await run('l', () => api.post('panel/plans', { action: 'save_limits', ...f }))) onSaved(); };
  const cell = 'h-9 w-full min-w-[90px]';
  return (
    <tr className="border-b border-line last:border-0">
      <td className="py-2 pr-3 font-medium">{l.kalit}</td>
      {['max_bots', 'max_bot_users', 'monthly_messages', 'max_members', 'max_api_keys'].map((k) => (
        <td key={k} className="px-1 py-2"><Input type="number" min="0" value={f[k]} onChange={set(k)} className={cell} /></td>
      ))}
      <td className="px-1 py-2"><Input value={f.allowed_templates} onChange={set('allowed_templates')} className={cell} /></td>
      <td className="py-2 pl-2 text-right"><Button size="sm" loading={busy === 'l'} onClick={save}>Saqlash</Button></td>
    </tr>
  );
}

export default function Plans() {
  const { data, error, loading, reload } = useApi('panel/plans');
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  return (
    <div className="animate-in space-y-6">
      <PageHeader title="Platforma tariflari" description="Foydalanuvchi obunalari (Pro, Premium, Max): narx, imtiyozlar va limitlar." />
      <div className="grid gap-6 xl:grid-cols-3">
        {data.plans.map((p) => <PlanCard key={p.id} p={p} onSaved={() => reload(true)} />)}
      </div>
      <Card title="Tarif limitlari" subtitle="0 = cheksiz. Shablonlar: * (hammasi) yoki vergul bilan id'lar (anime,starska).">
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
          <table className="w-full min-w-[860px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-3 font-medium">Tarif</th><th className="px-1 py-2 font-medium">Botlar</th><th className="px-1 py-2 font-medium">Bot foydalanuvchilari</th>
              <th className="px-1 py-2 font-medium">Xabar / oy</th><th className="px-1 py-2 font-medium">Jamoa</th><th className="px-1 py-2 font-medium">API kalitlar</th><th className="px-1 py-2 font-medium">Shablonlar</th><th />
            </tr></thead>
            <tbody>{data.limits.map((l) => <LimitRow key={l.kalit} l={l} onSaved={() => reload(true)} />)}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
