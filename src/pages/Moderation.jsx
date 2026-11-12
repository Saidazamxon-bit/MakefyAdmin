import { useMemo, useState } from 'react';
import { Ban, CheckCircle2, FlaskConical, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, PageHeader, SearchInput, Select, Stat, Switch, Table, Tabs, Textarea } from '../components/ui';

/*
 * Bot matnlari moderatsiyasi (backend: api/panel/moderation.php, includes/content_moderation.php).
 * Bot egalari «Dizayn boshqaruvi»da matn saqlaganda shu ro'yxat bo'yicha tekshiriladi; taqiqlangan matn saqlanmaydi.
 */

const CAT_TONE = { narko: 'bad', qimor: 'warn', adult: 'bad', firib: 'warn', qurol: 'bad', ekstrem: 'bad', haqorat: 'info', boshqa: 'gray' };

export default function Moderation() {
  const [tab, setTab] = useState('log');
  const [status, setStatus] = useState('');
  const [botQ, setBotQ] = useState('');
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (botQ.trim()) qs.set('bot', botQ.trim());
  const path = `panel/moderation${qs.toString() ? `?${qs}` : ''}`;
  const { data, error, loading, reload, setData } = useApi(path);
  const { busy, run } = useAction();
  const { confirm } = useFeedback();

  const cats = data?.categories || {};
  const post = async (key, body) => {
    const r = await run(key, () => api.post('panel/moderation', body));
    if (r && r.defaults) setData((d) => ({ ...d, ...r, log: d?.log || r.log }));
    return r;
  };

  if (loading && !data) return <Loading />;

  return (
    <div className="animate-in">
      <PageHeader
        title="Moderatsiya"
        description="Bot egalari o'zgartirgan matnlar shu ro'yxat bo'yicha tekshiriladi. Taqiqlangan so'z bo'lsa matn saqlanmaydi, urinish jurnalga yoziladi."
        actions={<Switch checked={!!data?.enabled} disabled={busy === 'en'} label={data?.enabled ? 'Filtr yoqilgan' : "Filtr o'chirilgan"}
          onChange={async (v) => { if (!v && !(await confirm({ text: "Filtr o'chirilsa, har qanday matn saqlanadi. Davom etilsinmi?", danger: true }))) return; post('en', { action: 'enabled', enabled: v }); }} />}
      />
      <ErrorBox error={error} onRetry={reload} />

      {data && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Stat label="Bloklangan (7 kun)" value={num(data.stats?.blocked7)} icon={Ban} tone="bad" />
            <Stat label="Saqlangan o'zgarishlar (7 kun)" value={num(data.stats?.saved7)} icon={CheckCircle2} tone="ok" />
            <Stat label="Faol so'zlar" value={num((data.defaults || []).filter((d) => !d.disabled).length + (data.custom || []).length)} icon={ShieldAlert} tone="brand" />
          </div>

          <Tabs value={tab} onChange={setTab} tabs={[
            { value: 'log', label: 'Jurnal' },
            { value: 'words', label: "So'zlar ro'yxati", count: (data.custom || []).length },
            { value: 'test', label: 'Sinab ko‘rish' },
          ]} />

          {tab === 'log' && <LogTab data={data} cats={cats} status={status} setStatus={setStatus} botQ={botQ} setBotQ={setBotQ} />}
          {tab === 'words' && <WordsTab data={data} cats={cats} busy={busy} post={post} confirm={confirm} />}
          {tab === 'test' && <TestTab cats={cats} />}
        </>
      )}
    </div>
  );
}

function LogTab({ data, cats, status, setStatus, botQ, setBotQ }) {
  return (
    <Card title="O'zgarishlar jurnali" subtitle="Oxirgi 300 ta yozuv. Bloklangan urinishlar — qoidabuzarlikka urinish belgisi."
      actions={<>
        <SearchInput value={botQ} onChange={setBotQ} placeholder="Bot username…" className="w-48" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">Hammasi</option>
          <option value="blocked">Bloklanganlar</option>
          <option value="saved">Saqlanganlar</option>
        </Select>
      </>}
      bodyClass="p-0 sm:p-0">
      <Table rowKey="_k" rows={(data.log || []).map((r, i) => ({ ...r, _k: `${r.at}-${i}` }))} empty={<Empty title="Jurnal bo'sh" text="Bot egalari matn o'zgartirganda shu yerda ko'rinadi." />} columns={[
        { key: 'at', title: 'Vaqt', render: (r) => <span className="tabular whitespace-nowrap text-muted">{r.at}</span> },
        { key: 'bot', title: 'Bot', render: (r) => (r.bot ? <Link className="font-medium text-brand hover:underline" to={`/bots/${encodeURIComponent(r.bot)}`}>@{r.bot}</Link> : '—') },
        { key: 'status', title: 'Natija', render: (r) => (r.status === 'blocked'
          ? <div className="space-y-1"><Badge tone="bad">Bloklandi</Badge>{r.word && <div className="text-xs text-muted">«{r.word}» · {cats[r.cat] || r.cat}</div>}</div>
          : <Badge tone="ok">Saqlandi</Badge>) },
        { key: 'src', title: 'Qayerdan', render: (r) => <span className="text-muted">{r.src === 'bot' ? 'Botda /dizayn' : 'Saytda'}{r.action === 'button' ? ' · tugma' : ''}</span> },
        { key: 'text', title: 'Matn', render: (r) => <p className="max-w-[460px] whitespace-pre-wrap break-words text-[13px]">{stripTags(r.text)}</p> },
      ]} />
    </Card>
  );
}

function WordsTab({ data, cats, busy, post, confirm }) {
  const [word, setWord] = useState('');
  const [cat, setCat] = useState('boshqa');
  const [q, setQ] = useState('');
  const [catF, setCatF] = useState('');
  const add = async () => { if (await post('add', { action: 'add', word, cat })) setWord(''); };
  const match = (w, c) => (!q || w.toLowerCase().includes(q.toLowerCase())) && (!catF || c === catF);
  const defaults = useMemo(() => (data.defaults || []).filter((d) => match(d.word, d.cat)), [data.defaults, q, catF]); // eslint-disable-line react-hooks/exhaustive-deps
  const custom = (data.custom || []).filter((d) => match(d.word, d.cat));

  return (
    <div className="space-y-4">
      <Card title="Yangi so'z yoki ibora qo'shish" subtitle="Katta-kichik harf, lotin/kirill farq qilmaydi. «so'z*» — shu bilan boshlanuvchi barcha so'zlar. 7+ harfli so'z va iboralar bo'sh joy/belgilar bilan yozilsa ham ushlanadi.">
        <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
          <Field label="So'z / ibora"><Input value={word} onChange={(e) => setWord(e.target.value)} placeholder="masalan: kazino bonus yoki pizd*" onKeyDown={(e) => e.key === 'Enter' && word.trim() && add()} /></Field>
          <Field label="Toifa">
            <Select value={cat} onChange={(e) => setCat(e.target.value)}>
              {Object.entries(cats).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <Button variant="primary" icon={Plus} loading={busy === 'add'} disabled={word.trim().length < 2} onClick={add}>Qo'shish</Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="So'zni qidirish…" className="w-60" />
        <Select value={catF} onChange={(e) => setCatF(e.target.value)} className="w-56">
          <option value="">Barcha toifalar</option>
          {Object.entries(cats).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>

      <Card title="Admin qo'shgan so'zlar" bodyClass="p-0 sm:p-0">
        <Table rowKey="word" rows={custom} empty={<Empty title="Hali so'z qo'shilmagan" />} columns={[
          { key: 'word', title: "So'z", render: (d) => <code className="rounded bg-surface-2 px-2 py-1 font-semibold">{d.word}</code> },
          { key: 'cat', title: 'Toifa', render: (d) => <Badge tone={CAT_TONE[d.cat] || 'gray'}>{cats[d.cat] || d.cat}</Badge> },
          { key: 'at', title: "Qo'shilgan", render: (d) => <span className="text-muted">{d.at}{d.by ? ` · ${d.by}` : ''}</span> },
          { key: 'del', title: '', align: 'right', render: (d) => (
            <Button size="icon" variant="ghost" aria-label="O'chirish" icon={Trash2} loading={busy === `rm${d.word}`}
              onClick={async () => { if (await confirm({ text: `«${d.word}» ro'yxatdan o'chirilsinmi?`, danger: true })) post(`rm${d.word}`, { action: 'remove', word: d.word }); }} />
          ) },
        ]} />
      </Card>

      <Card title="Standart ro'yxat" subtitle="Platforma bilan birga keladi. Noto'g'ri bloklayotgan so'zni o'chirib qo'yish mumkin." bodyClass="p-0 sm:p-0">
        <Table rowKey="word" dense rows={defaults} empty={<Empty title="Topilmadi" />} columns={[
          { key: 'word', title: "So'z", render: (d) => <code className={d.disabled ? 'text-muted line-through' : 'font-semibold'}>{d.word}</code> },
          { key: 'cat', title: 'Toifa', render: (d) => <Badge tone={d.disabled ? 'gray' : CAT_TONE[d.cat] || 'gray'}>{cats[d.cat] || d.cat}</Badge> },
          { key: 'on', title: 'Faol', align: 'right', render: (d) => <Switch checked={!d.disabled} disabled={busy === `df${d.word}`} onChange={(v) => post(`df${d.word}`, { action: 'default', word: d.word, disabled: !v })} /> },
        ]} />
      </Card>
    </div>
  );
}

function TestTab({ cats }) {
  const [text, setText] = useState('');
  const [res, setRes] = useState(undefined);
  const { busy, run } = useAction();
  const test = async () => { const r = await run('t', () => api.post('panel/moderation', { action: 'test', text }), { success: '' }); if (r) setRes(r.hit || null); };
  return (
    <Card title="Matnni sinab ko'rish" subtitle="Matn saqlanmaydi va jurnalga yozilmaydi. Filtr o'chirilgan bo'lsa ham tekshiradi.">
      <Field label="Matn"><Textarea rows={5} value={text} onChange={(e) => { setText(e.target.value); setRes(undefined); }} placeholder="Bot matnini shu yerga yozing…" /></Field>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="primary" icon={FlaskConical} loading={busy === 't'} disabled={!text.trim()} onClick={test}>Tekshirish</Button>
        {res === null && <Badge tone="ok">Toza — saqlanadi</Badge>}
        {res && <Badge tone="bad">Bloklanadi: «{res.word}» · {cats[res.cat] || res.catName}</Badge>}
      </div>
    </Card>
  );
}

function stripTags(s) { return String(s || '').replace(/<[^>]+>/g, ''); }
