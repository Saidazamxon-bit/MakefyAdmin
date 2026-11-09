import { useState } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { date, money, num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, ErrorBox, Loading, PageHeader } from '../components/ui';

export default function Templates() {
  const { data, error, loading, reload } = useApi('panel/templates');
  const [result, setResult] = useState(null);
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const outdated = data.templates.reduce((n, t) => n + t.outdated.length, 0);

  const sync = async (key, body, ask) => {
    if (ask && !(await confirm(ask))) return;
    const r = await run(key, () => api.post('panel/templates', body));
    if (r) { setResult(r); reload(true); }
  };

  return (
    <div className="animate-in space-y-6">
      <PageHeader
        title="Shablonlar"
        description="Har bir shablonning kodi bitta joyda (VisionBuilder/shablon_src). U o'zgarsa, yangilanish shu shablondagi barcha botlarga — eskilariga ham — avtomatik tarqaladi. Botlarning ma'lumotlariga tegilmaydi."
        actions={<>
          <Button icon={RefreshCw} variant="primary" loading={busy === 'all'} onClick={() => sync('all', {})}>Hammasini yangilash{outdated > 0 && ` (${outdated})`}</Button>
          <Button loading={busy === 'force'} onClick={() => sync('force', { force: 1 }, { text: "Barcha botlarning kodi manbadan majburan qayta yig'iladi (ma'lumotlarga tegilmaydi). Davom etilsinmi?" })}>Majburan qayta yig'ish</Button>
        </>}
      />
      <div className="flex flex-wrap gap-3 text-sm">
        <Badge tone={data.autoSync ? 'ok' : 'warn'}>Avtomatik tarqatish: {data.autoSync ? 'yoqilgan' : "o'chiq (TEMPLATE_AUTO_SYNC=off)"}</Badge>
        {data.lastAutoSync && <Badge>Oxirgi tekshiruv: {date(data.lastAutoSync)}</Badge>}
      </div>
      {result?.summary && (
        <div className="rounded-xl border border-line bg-surface p-4 text-sm">
          <p className="font-medium">Natija: {num(result.summary.bots)} ta bot tekshirildi, {num(result.summary.synced)} ta yangilandi, {num(result.summary.changed)} tasida fayl o'zgardi, {num(result.summary.errors)} ta xato.</p>
          {result.failed?.length > 0 && <ul className="mt-2 list-disc pl-5 text-bad">{result.failed.map((f) => <li key={f.bot}>@{f.bot}: {f.xabar}</li>)}</ul>}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.templates.map((t) => (
          <Card key={t.id} bodyClass="flex h-full flex-col">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl">{t.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t.name}</p>
                <p className="text-xs text-muted">{t.id} · v{t.version} · {t.category}</p>
              </div>
              <Badge tone={t.price > 0 ? 'brand' : 'ok'}>{t.price > 0 ? money(t.price) : 'Bepul'}</Badge>
            </div>
            <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted">{t.description}</p>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
              <div className="text-sm">
                <span className="tabular font-medium">{num(t.bots)}</span> <span className="text-muted">bot</span>
                {t.bots > 0 && (t.outdated.length
                  ? <Badge tone="warn" className="ml-2">{t.outdated.length} ta eskirgan</Badge>
                  : <span className="ml-2 inline-flex items-center gap-1 text-xs text-ok"><CheckCircle2 className="size-3.5" />hammasi yangi</span>)}
              </div>
              <Button size="sm" icon={RefreshCw} disabled={!t.bots} loading={busy === t.id} onClick={() => sync(t.id, { turi: t.id })}>Yangilash</Button>
            </div>
            {t.outdated.length > 0 && <p className="mt-2 truncate text-xs text-muted" title={t.outdated.join(', ')}>{t.outdated.slice(0, 4).map((b) => `@${b}`).join(', ')}{t.outdated.length > 4 && ' …'}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
