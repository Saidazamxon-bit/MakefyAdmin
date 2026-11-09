import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { money, num } from '../lib/format';
import { useAction } from '../components/feedback';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, PageHeader, Select, Switch, Tabs, Textarea } from '../components/ui';

function PlanForm({ t, onSaved }) {
  const [f, setF] = useState({ ...t, features: JSON.stringify(t.features || {}, null, 2) });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const { busy, run } = useAction();
  const [jsonErr, setJsonErr] = useState('');
  const save = async () => {
    let features;
    try { features = JSON.parse(f.features || '{}'); setJsonErr(''); } catch { setJsonErr("JSON noto'g'ri"); return; }
    const body = { ...f, features, bosqich: +f.bosqich, narx: +f.narx, muddatKun: +f.muddatKun, maxUsers: +f.maxUsers, monthlyMessages: +f.monthlyMessages, webappNarx: +f.webappNarx, tezlik: +f.tezlik };
    if (await run('s', () => api.post('panel/bot_plans', body))) onSaved();
  };
  return (
    <Card
      title={<span className="flex items-center gap-2">{t.nomi}<Badge tone="brand">{t.kalit}</Badge>{!f.faol && <Badge tone="bad">yashirin</Badge>}</span>}
      subtitle={`${num(t.bots)} ta bot shu tarifda · ${money(t.narx)}/oy`}
      actions={<Button size="sm" variant="primary" loading={busy === 's'} onClick={save}>Saqlash</Button>}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nomi"><Input value={f.nomi} onChange={set('nomi')} /></Field>
        <Field label="Narx (so'm/oy)"><Input type="number" min="0" value={f.narx} onChange={set('narx')} /></Field>
        <Field label="Muddat (kun)"><Input type="number" min="1" value={f.muddatKun} onChange={set('muddatKun')} /></Field>
        <Field label="Bosqich (tartib)"><Input type="number" min="1" max="9" value={f.bosqich} onChange={set('bosqich')} /></Field>
        <Field label="Maks. foydalanuvchi" hint="0 = cheksiz"><Input type="number" min="0" value={f.maxUsers} onChange={set('maxUsers')} /></Field>
        <Field label="Xabar / oy" hint="0 = cheksiz"><Input type="number" min="0" value={f.monthlyMessages} onChange={set('monthlyMessages')} /></Field>
        <Field label="Web App"><Select value={f.webapp} onChange={set('webapp')}><option value="yopiq">Yopiq</option><option value="pullik">Pullik qo'shimcha</option><option value="bor">Tarifga kiradi</option></Select></Field>
        <Field label="Web App narxi"><Input type="number" min="0" value={f.webappNarx} disabled={f.webapp !== 'pullik'} onChange={set('webappNarx')} /></Field>
        <Field label="Tezlik (1–5)"><Input type="number" min="1" max="5" value={f.tezlik} onChange={set('tezlik')} /></Field>
        <Field label="Funksiyalar (JSON)" error={jsonErr} hint='Masalan: {"majburiy_obuna": true, "max_kontent": 300}' className="sm:col-span-2 lg:col-span-3">
          <Textarea rows={3} value={f.features} onChange={set('features')} className="font-mono text-xs" />
        </Field>
      </div>
      <div className="mt-4"><Switch checked={!!f.faol} onChange={set('faol')} label="Faol (foydalanuvchilarga ko'rinadi)" /></div>
    </Card>
  );
}

export default function BotPlans() {
  const { data, error, loading, reload } = useApi('panel/bot_plans');
  const types = useMemo(() => [...new Map((data?.items || []).map((t) => [t.botTuri, t.typeName])).entries()], [data]);
  const [type, setType] = useState('');
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const cur = type || types[0]?.[0];
  const list = data.items.filter((t) => t.botTuri === cur);
  return (
    <div className="animate-in">
      <PageHeader title="Bot tariflari" description="Har bir shablon turi uchun alohida tariflar. Saqlangach shu tarifdagi botlarning limitlari darhol yangilanadi." />
      {types.length ? (
        <>
          <Tabs value={cur} onChange={setType} tabs={types.map(([k, n]) => ({ value: k, label: n }))} />
          <div className="space-y-6">{list.map((t) => <PlanForm key={t.id} t={t} onSaved={() => reload(true)} />)}</div>
        </>
      ) : <Card><Empty title="Bot tariflari topilmadi" text="Migratsiyalarni qo'llang: php tools/migrate.php" /></Card>}
    </div>
  );
}
