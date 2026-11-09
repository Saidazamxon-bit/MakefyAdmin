import { useState } from 'react';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { num, shortDay } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, ErrorBox, Field, Input, Loading, PageHeader, Switch } from '../components/ui';
import { BarChart } from '../components/Charts';

function Provider({ p, onChange }) {
  const [model, setModel] = useState(p.model);
  const [key, setKey] = useState('');
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  const post = async (k, body) => { const r = await run(k, () => api.post('panel/ai', { provider: p.provider, ...body })); if (r) onChange(r.providers); return r; };
  return (
    <Card
      title={<span className="flex items-center gap-2">{p.label}<Badge>#{p.order}</Badge>{p.source === 'none' && <Badge tone="bad">kalit yo'q</Badge>}{p.source === 'env' && <Badge tone="info">.env</Badge>}</span>}
      subtitle={`Ishlatilayotgan model: ${p.effectiveModel}`}
      actions={<Switch checked={p.enabled} disabled={busy === 'en'} onChange={(v) => post('en', { action: 'save', model, enabled: v })} label={p.enabled ? 'Yoqilgan' : "O'chiq"} />}
    >
      <div className="space-y-4">
        <Field label="Model" hint={`Bo'sh qoldirilsa: ${p.envModel || p.defaultModel}`}>
          <div className="flex gap-2"><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder={p.defaultModel} /><Button loading={busy === 'm'} onClick={() => post('m', { action: 'save', model, enabled: p.enabled })}>Saqlash</Button></div>
        </Field>
        <div>
          <p className="mb-2 text-[13px] font-medium">API kalitlar {p.envKeyCount > 0 && <span className="font-normal text-muted">(.env da yana {p.envKeyCount} ta)</span>}</p>
          <ul className="mb-3 space-y-1.5">
            {p.keys.map((k) => (
              <li key={k.index} className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <KeyRound className="size-4 text-muted" /><code className="flex-1 truncate">{k.masked}</code>
                <Button size="icon" variant="ghost" aria-label="O'chirish" icon={Trash2} loading={busy === `d${k.index}`} onClick={async () => { if (await confirm({ text: "Kalit o'chirilsinmi?", danger: true })) post(`d${k.index}`, { action: 'del_key', index: k.index }); }} />
              </li>
            ))}
            {!p.keys.length && <li className="text-sm text-muted">Bazada kalit yo'q.</li>}
          </ul>
          <div className="flex gap-2">
            <Input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Yangi API kalit" />
            <Button icon={Plus} loading={busy === 'k'} onClick={async () => { if (key.trim() && await post('k', { action: 'add_key', key })) setKey(''); }}>Qo'shish</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Ai() {
  const { data, error, loading, reload, setData } = useApi('panel/ai');
  const [pricing, setPricing] = useState(null);
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const pr = pricing || data.pricing;
  return (
    <div className="animate-in space-y-6">
      <PageHeader title="AI sozlamalari" description="AI Bot yaratuvchi uchun provayderlar, kalitlar va narxlash. Provayderlar tartib bo'yicha ishlatiladi; biri ishlamasa keyingisiga o'tiladi." />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="AI so'rovlari" subtitle="Oxirgi 14 kun" className="xl:col-span-2">
          {data.usage.length ? <BarChart data={data.usage.map((u) => ({ label: shortDay(u.d), value: +u.n }))} format={(v) => `${num(v)} ta`} /> : <p className="text-sm text-muted">Hali foydalanilmagan.</p>}
        </Card>
        <Card title="Narxlash" subtitle="AI yaratgan bot narxi = asos × koeffitsient (murakkablikka qarab)">
          <div className="space-y-4">
            <Field label="Asosiy narx (so'm)"><Input type="number" min="0" value={pr.base} onChange={(e) => setPricing({ ...pr, base: e.target.value })} /></Field>
            <Field label="Koeffitsient"><Input type="number" step="0.1" min="0.1" value={pr.mult} onChange={(e) => setPricing({ ...pr, mult: e.target.value })} /></Field>
            <Button variant="primary" loading={busy === 'p'} onClick={() => run('p', () => api.post('panel/ai', { action: 'pricing', base: +pr.base, mult: +pr.mult }))}>Saqlash</Button>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {data.providers.map((p) => <Provider key={p.provider} p={p} onChange={(providers) => setData((d) => ({ ...d, providers }))} />)}
      </div>
    </div>
  );
}
