import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { useAction } from '../components/feedback';
import { Button, Card, ErrorBox, Field, Input, Loading, PageHeader, Switch, Textarea } from '../components/ui';

const GROUPS = [
  ['main', 'Asosiy', 'Platforma botining umumiy sozlamalari.'],
  ['access', 'Adminlar va majburiy obuna', "Adminlar /panel va /panelweb buyruqlaridan foydalana oladi."],
  ['bonus', "Bonus o'yini", 'Kunlik bonus sozlamalari.'],
  ['content', 'Matnlar', ''],
];

export default function Settings() {
  const { data, error, loading, reload } = useApi('panel/settings');
  const [draft, setDraft] = useState({});
  const { busy, run } = useAction();
  const fields = useMemo(() => data?.fields || [], [data]);
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;

  const val = (f) => (f.key in draft ? draft[f.key] : f.value);
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const dirty = Object.keys(draft).length > 0;
  const save = async () => { if (await run('s', () => api.post('panel/settings', { values: draft }))) { setDraft({}); reload(true); } };

  const control = (f) => {
    if (f.type === 'switch') return <Switch checked={!!val(f)} onChange={(v) => set(f.key, v)} label={val(f) ? 'Yoqilgan' : "O'chirilgan"} />;
    if (f.type === 'textarea' || f.type === 'lines') return <Textarea rows={f.type === 'lines' ? 4 : 7} value={val(f)} onChange={(e) => set(f.key, e.target.value)} className={f.type === 'lines' ? 'font-mono text-xs' : ''} />;
    return <Input type={f.type === 'number' ? 'number' : 'text'} min={f.type === 'number' ? 0 : undefined} value={val(f)} onChange={(e) => set(f.key, e.target.value)} />;
  };

  return (
    <div className="animate-in space-y-6 pb-20">
      <PageHeader
        title="Bot sozlamalari"
        description="Telegramdagi platforma botining sozlamalari. Telegramdagi «⚙ Sozlamalar» bilan bir xil joyda saqlanadi — qaysi biridan o'zgartirsangiz ham ikkalasida bir xil bo'ladi."
        actions={<Button variant="primary" icon={Save} disabled={!dirty} loading={busy === 's'} onClick={save}>Saqlash</Button>}
      />
      {GROUPS.map(([g, title, sub]) => {
        const list = fields.filter((f) => f.group === g);
        if (!list.length) return null;
        return (
          <Card key={g} title={title} subtitle={sub || undefined}>
            <div className="grid gap-5 md:grid-cols-2">
              {list.map((f) => (
                <Field key={f.key} label={f.label} hint={f.hint} className={f.type === 'textarea' || f.type === 'lines' ? 'md:col-span-1' : ''}>{control(f)}</Field>
              ))}
            </div>
          </Card>
        );
      })}
      {dirty && (
        <div className="animate-in fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
            <p className="text-sm text-muted">Saqlanmagan o'zgarishlar bor.</p>
            <div className="flex gap-2"><Button onClick={() => setDraft({})}>Bekor qilish</Button><Button variant="primary" icon={Save} loading={busy === 's'} onClick={save}>Saqlash</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
