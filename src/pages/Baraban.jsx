import { useRef, useState } from 'react';
import { BadgePercent, CalendarPlus, Check, CircleOff, Crown, Gift, ImagePlus, ListPlus, Pencil, Plus, RotateCw, Ticket, Trash2, Wallet, X } from 'lucide-react';
import { api, mediaUrl } from '../lib/api';
import { useApi } from '../lib/hooks';
import { money, num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, Select, Stat, Switch, Table, Tabs } from '../components/ui';

/*
 * Baraban (backend: api/panel/baraban.php, includes/baraban.php).
 * Sovg'alar va ularning ehtimoli (og'irligi), zaxira, NFT belgisi; sozlamalar (haftalik bepul chipta, chipta narxi);
 * foydalanuvchiga chipta berish; aylantirishlar jurnali — qo'lda beriladigan sovg'alarni «Berildi» deb belgilash.
 */
const TYPE_TONE = { balans: 'ok', chipta: 'warn', tarif: 'warn', bot_kun: 'info', chegirma: 'brand', sovga: 'brand', bosh: 'gray' };
const TYPE_ICON = { balans: Wallet, chipta: RotateCw, tarif: Crown, bot_kun: CalendarPlus, chegirma: BadgePercent, sovga: Gift, bosh: CircleOff };
const TYPE_BG = {
  balans: 'linear-gradient(135deg,#22c55e,#14b8a6)', chipta: 'linear-gradient(135deg,#38bdf8,#6366f1)', tarif: 'linear-gradient(135deg,#f59e0b,#f97316)',
  bot_kun: 'linear-gradient(135deg,#06b6d4,#3b82f6)', chegirma: 'linear-gradient(135deg,#ec4899,#a855f7)', sovga: 'linear-gradient(135deg,#a855f7,#6366f1)', bosh: 'linear-gradient(135deg,#475569,#334155)',
};
const HOLAT = {
  berildi: ['Berildi', 'ok'], kutilmoqda: ['Kutilmoqda', 'warn'], bekor: ['Bekor', 'bad'], tanlash: ['Bot tanlanmagan', 'warn'], kupon: ['Kupon berildi', 'info'],
};
/** Sovg'aning qisqa tavsifi (jadval uchun) */
function prizeDetail(p, data) {
  const plan = (data.plans || []).find((x) => x.kalit === p.param);
  if (p.turi === 'balans') return money(p.qiymat);
  if (p.turi === 'chipta') return `+${p.qiymat} aylantirish`;
  if (p.turi === 'tarif') return `${plan?.nomi || p.param || '—'} · ${p.qiymat} kun`;
  if (p.turi === 'bot_kun') return `+${p.qiymat} kun (foydalanuvchi botni tanlaydi)`;
  if (p.turi === 'chegirma') return `${p.qiymat >= 100 ? 'Bepul' : `-${p.qiymat}%`} · ${(data.scopes || {})[p.param] || p.param}`;
  return '';
}

function fileToData(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256; const c = document.createElement('canvas'); c.width = size; c.height = size;
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Rasmni o'qib bo'lmadi.")); };
    img.src = url;
  });
}

function PrizeIcon({ p, size = 40 }) {
  const src = p.image || (p.rasm ? mediaUrl(p.rasm) : '');
  return src
    ? <img src={src} alt="" className="shrink-0 rounded-lg object-contain" style={{ width: size, height: size }} />
    : (() => { const I = TYPE_ICON[p.turi] || Gift; return <span className="grid shrink-0 place-items-center rounded-lg text-white shadow-sm" style={{ width: size, height: size, background: TYPE_BG[p.turi] || TYPE_BG.sovga }}><I style={{ width: size * 0.5, height: size * 0.5 }} /></span>; })();
}

function PrizeModal({ prize, types, scopes = {}, plans = [], onClose, onSaved }) {
  const [f, setF] = useState(() => ({
    id: prize?.id || 0, nomi: prize?.nomi || '', rasm: prize?.rasm || '', image: '', param: prize?.param || '',
    turi: prize?.turi || 'sovga', qiymat: prize?.qiymat ?? 0, vazn: prize?.vazn ?? 10, nft: !!prize?.nft,
    soni: prize?.soni ?? -1, faol: prize ? !!prize.faol : true, tartib: prize?.tartib ?? 0,
  }));
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const { busy, run } = useAction();
  const { toast } = useFeedback();
  const file = useRef(null);
  const save = async () => {
    const body = { action: 'prize', ...f, qiymat: Number(f.qiymat), vazn: Number(f.vazn), soni: Number(f.soni), tartib: Number(f.tartib) };
    if (!body.image) delete body.image;
    const r = await run('s', () => api.post('panel/baraban', body));
    if (r) { onSaved(r); onClose(); }
  };
  const valueLabel = {
    balans: "Summa (so'm)", chipta: 'Necha marta qo‘shimcha aylantirish', tarif: 'Necha kun (30 = 1 oy)', bot_kun: 'Botga qo‘shiladigan kunlar',
    chegirma: 'Chegirma foizi (100 = bepul)', sovga: 'Qiymati (ixtiyoriy, masalan Stars soni)', bosh: 'Qiymat',
  }[f.turi];
  const hint = {
    sovga: "Admin qo'lda beradi (jurnalda «Kutilmoqda»)", bosh: '«Omad kelmadi» — hech narsa berilmaydi',
    tarif: 'Faol tarif bo‘lsa — muddati uzayadi, aks holda shu tarif beriladi', bot_kun: 'Bitta bot bo‘lsa avtomatik, bir nechta bo‘lsa foydalanuvchi tanlaydi',
    chegirma: 'Kupon 30 kun amal qiladi, foydalanuvchi Baraban sahifasida ishlatadi',
  }[f.turi] || 'Avtomatik beriladi';
  const setTuri = (e) => { const t = e.target.value; setF((x) => ({ ...x, turi: t, param: t === 'tarif' ? (plans.find((pl) => pl.kalit === x.param) ? x.param : plans[0]?.kalit || '') : t === 'chegirma' ? (scopes[x.param] ? x.param : 'tarif') : '' })); };
  return (
    <Modal open onClose={onClose} title={f.id ? "Sovg'ani tahrirlash" : "Yangi sovg'a"} wide
      footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" loading={busy === 's'} onClick={save}>Saqlash</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomi" className="sm:col-span-2"><Input value={f.nomi} maxLength={80} onChange={set('nomi')} placeholder="50 Stars, Muzqaymoq NFT, 5 000 so'm…" /></Field>
        <Field label="Ko‘rinishi" hint="Rasm yuklanmasa — turiga mos zamonaviy ikonka ko‘rsatiladi. Kvadrat PNG (256×256) tavsiya etiladi." className="sm:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <PrizeIcon p={f} size={56} />
            <input ref={file} type="file" accept="image/*" className="hidden" onChange={async (e) => { const fl = e.target.files?.[0]; e.target.value = ''; if (!fl) return; try { const d = await fileToData(fl); setF((x) => ({ ...x, image: d })); } catch (er) { toast(er.message, 'bad'); } }} />
            <Button icon={ImagePlus} onClick={() => file.current?.click()}>Rasm yuklash</Button>
            {(f.image || f.rasm) && <Button variant="ghost" icon={X} onClick={() => setF((x) => ({ ...x, image: '', rasm: '' }))}>Rasmni olib tashlash</Button>}
          </div>
        </Field>
        <Field label="Turi" hint={hint}>
          <Select value={f.turi} onChange={setTuri}>{Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        </Field>
        <Field label={valueLabel}><Input type="number" min="0" max={f.turi === 'chegirma' ? 100 : undefined} value={f.qiymat} onChange={set('qiymat')} disabled={f.turi === 'bosh'} /></Field>
        {f.turi === 'tarif' && (
          <Field label="Qaysi tarif" hint={plans.length ? 'Tariflar ro‘yxati «Tariflar» bo‘limidan olinadi' : 'Avval tarif yarating'} className="sm:col-span-2">
            <Select value={f.param} onChange={set('param')}>
              {!plans.length && <option value="">— tarif yo‘q —</option>}
              {plans.map((pl) => <option key={pl.kalit} value={pl.kalit}>{pl.nomi} ({pl.kalit}) · {money(pl.narxi)} / {pl.muddat_kun} kun</option>)}
            </Select>
          </Field>
        )}
        {f.turi === 'chegirma' && (
          <Field label="Chegirma nimaga" className="sm:col-span-2">
            <Select value={f.param} onChange={set('param')}>{Object.entries(scopes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
          </Field>
        )}
        <Field label="Og'irlik (ehtimol)" hint="Nisbiy: 10 va 30 bo'lsa — 1:3. Foiz avtomatik hisoblanadi."><Input type="number" min="0" step="0.1" value={f.vazn} onChange={set('vazn')} /></Field>
        <Field label="Zaxira (necha marta tushadi)" hint="-1 = cheksiz, 0 = tugagan"><Input type="number" min="-1" value={f.soni} onChange={set('soni')} /></Field>
        <Field label="Tartib" hint="Lentadagi o'rni (kichik — oldinda)"><Input type="number" value={f.tartib} onChange={set('tartib')} /></Field>
        <div className="flex flex-col justify-end gap-3 pb-1">
          <Switch checked={f.nft} onChange={set('nft')} label="NFT belgisi" />
          <Switch checked={f.faol} onChange={set('faol')} label="Faol (barabanda bor)" />
        </div>
      </div>
    </Modal>
  );
}

function SettingsCard({ s, onSaved }) {
  const [f, setF] = useState(s);
  const { busy, run } = useAction();
  const dirty = JSON.stringify(f) !== JSON.stringify(s);
  const save = async () => { const r = await run('st', () => api.post('panel/baraban', { action: 'settings', ...f, dailyFree: Number(f.dailyFree), ticketPrice: Number(f.ticketPrice), maxBuy: Number(f.maxBuy) })); if (r) onSaved(r); };
  return (
    <Card title="Sozlamalar" actions={<Button variant={dirty ? 'primary' : 'secondary'} disabled={!dirty} loading={busy === 'st'} onClick={save}>Saqlash</Button>}>
      <div className="grid gap-4 sm:grid-cols-4 sm:items-end">
        <div className="pb-2"><Switch checked={f.enabled} onChange={(v) => setF((x) => ({ ...x, enabled: v }))} label={f.enabled ? 'Baraban yoqilgan' : "Baraban o'chirilgan"} /></div>
        <Field label="Haftalik bepul chipta (har 7 kunda)" hint="0 = o'chirilgan"><Input type="number" min="0" max="10" value={f.dailyFree} onChange={(e) => setF((x) => ({ ...x, dailyFree: e.target.value }))} /></Field>
        <Field label="Chipta narxi (so'm)" hint="0 = sotilmaydi"><Input type="number" min="0" value={f.ticketPrice} onChange={(e) => setF((x) => ({ ...x, ticketPrice: e.target.value }))} /></Field>
        <Field label="Bir martada maks." hint="Sotib olish"><Input type="number" min="1" max="100" value={f.maxBuy} onChange={(e) => setF((x) => ({ ...x, maxBuy: e.target.value }))} /></Field>
      </div>
    </Card>
  );
}

function TicketsCard({ onSaved }) {
  const [f, setF] = useState({ user_id: '', count: 1, izoh: '' });
  const { busy, run } = useAction();
  const give = async (sign) => { const r = await run('t', () => api.post('panel/baraban', { action: 'tickets', ...f, count: sign * Math.abs(Number(f.count)) })); if (r) { onSaved(r); setF((x) => ({ ...x, izoh: '' })); } };
  return (
    <Card title="Chipta berish" subtitle="Aksiya, konkurs yoki kompensatsiya uchun foydalanuvchiga chipta qo'shing yoki oling.">
      <div className="grid gap-3 sm:grid-cols-[1fr_120px_1.4fr_auto_auto] sm:items-end">
        <Field label="Foydalanuvchi ID"><Input value={f.user_id} onChange={(e) => setF((x) => ({ ...x, user_id: e.target.value.replace(/\D/g, '') }))} placeholder="5600000000" inputMode="numeric" /></Field>
        <Field label="Soni"><Input type="number" min="1" max="1000" value={f.count} onChange={(e) => setF((x) => ({ ...x, count: e.target.value }))} /></Field>
        <Field label="Izoh (ixtiyoriy)"><Input value={f.izoh} onChange={(e) => setF((x) => ({ ...x, izoh: e.target.value }))} placeholder="Konkurs g'olibi" /></Field>
        <Button variant="primary" icon={Ticket} loading={busy === 't'} disabled={!f.user_id} onClick={() => give(1)}>Berish</Button>
        <Button disabled={!f.user_id || busy === 't'} onClick={() => give(-1)}>Olib qo'yish</Button>
      </div>
    </Card>
  );
}

export default function Baraban() {
  const [holat, setHolat] = useState('');
  const { data, error, loading, reload, setData } = useApi(`panel/baraban${holat ? `?holat=${holat}` : ''}`);
  const [edit, setEdit] = useState(null);
  const [tab, setTab] = useState('prizes');
  const { busy, run } = useAction();
  const { confirm } = useFeedback();
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const apply = (r) => setData((d) => ({ ...d, ...r, spins: holat ? d.spins : r.spins }));
  const post = async (key, body) => { const r = await run(key, () => api.post('panel/baraban', body)); if (r) { apply(r); if (holat) reload(true); } };
  const st = data.stats || {};
  const totalChance = data.prizes.filter((p) => p.faol && p.soni !== 0).reduce((a, p) => a + p.chance, 0);

  return (
    <div className="animate-in space-y-6">
      <PageHeader title={<span className="flex items-center gap-2"><Gift className="size-5 text-brand" />Baraban</span>}
        description="Foydalanuvchilar chipta bilan barabanni aylantiradi. Sovg'alar, ehtimollar, chiptalar va qo'lda beriladigan sovg'alar shu yerda."
        actions={<div className="flex flex-wrap gap-2">
          <Button icon={ListPlus} loading={busy === 'seed'} onClick={async () => { if (await confirm({ text: "Boshlang'ich 50 ta sovg'a ro'yxati qo'shilsinmi? Mavjud sovg'alarga tegilmaydi." })) post('seed', { action: 'seed' }); }}>Boshlang'ich ro'yxat</Button>
          <Button variant="primary" icon={Plus} onClick={() => setEdit({})}>Yangi sovg'a</Button>
        </div>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Bugun aylantirildi" value={num(st.today)} />
        <Stat label="Jami aylantirish" value={num(st.total)} />
        <Stat label="Berilishi kutilmoqda" value={num(st.pending)} tone={st.pending ? 'warn' : 'brand'} />
        <Stat label="Balansga berilgan" value={money(st.paid)} tone="ok" />
        <Stat label="Chiptalar" value={`${num(st.sold)} / ${num(st.tickets)}`} hint="sotilgan / hozir foydalanuvchilarda" />
        <Stat label="Chegirma kuponlari" value={`${num(st.couponsUsed)} / ${num(st.coupons)}`} hint="ishlatilgan / berilgan" />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'prizes', label: "Sovg'alar", count: data.prizes.length },
        { value: 'spins', label: 'Jurnal', count: st.pending },
        { value: 'settings', label: 'Sozlamalar va chiptalar' },
      ]} />

      {tab === 'prizes' && (
        <Card title="Sovg'alar" subtitle={`Faol sovg'alar ehtimoli jami ${Math.round(totalChance)}%. «Bo'sh» — «Omad kelmadi». Rasm yuklanmagan sovg'alarda turiga mos ikonka chiqadi.`} bodyClass="p-0 sm:p-0">
          <Table rows={data.prizes} empty={<Empty title="Sovg'alar yo'q" text="«Yangi sovg'a» tugmasi bilan qo'shing — kamida bittasi bo'lsa baraban ishlaydi." />} columns={[
            { key: 'nomi', title: "Sovg'a", render: (p) => <div className="flex items-center gap-3"><PrizeIcon p={p} /><div><p className="font-medium">{p.nomi}</p>{p.nft && <Badge tone="info">NFT</Badge>}</div></div> },
            { key: 'turi', title: 'Turi', render: (p) => <div><Badge tone={TYPE_TONE[p.turi]}>{data.types[p.turi]}</Badge>{prizeDetail(p, data) && <p className="mt-1 text-xs text-muted">{prizeDetail(p, data)}</p>}</div> },
            { key: 'chance', title: 'Ehtimol', render: (p) => <div className="min-w-[110px]"><p className="tabular text-sm font-medium">{p.chance}%</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-brand" style={{ width: `${Math.min(100, p.chance)}%` }} /></div><p className="mt-0.5 text-[11px] text-muted">og'irlik {p.vazn}</p></div> },
            { key: 'soni', title: 'Zaxira', render: (p) => (p.soni < 0 ? <span className="text-muted">cheksiz</span> : p.soni === 0 ? <Badge tone="bad">tugagan</Badge> : <span className="tabular">{num(p.soni)}</span>) },
            { key: 'faol', title: 'Faol', render: (p) => <Switch checked={p.faol} disabled={busy === `f${p.id}`} onChange={(v) => post(`f${p.id}`, { action: 'prize', ...p, faol: v })} /> },
            { key: 'a', title: '', align: 'right', render: (p) => (
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" icon={Pencil} aria-label="Tahrirlash" onClick={() => setEdit(p)} />
                <Button size="icon" variant="ghost" icon={Trash2} aria-label="O'chirish" loading={busy === `d${p.id}`} onClick={async () => { if (await confirm({ text: `«${p.nomi}» o'chirilsinmi?`, danger: true })) post(`d${p.id}`, { action: 'prize_delete', id: p.id }); }} />
              </div>
            ) },
          ]} />
        </Card>
      )}

      {tab === 'spins' && (
        <Card title="Aylantirishlar jurnali" subtitle="Qo'lda beriladigan sovg'ani foydalanuvchiga yuborgach «Berildi» ni bosing — u saytda holatni ko'radi."
          actions={<Select value={holat} onChange={(e) => setHolat(e.target.value)} className="w-44"><option value="">Hammasi</option><option value="kutilmoqda">Kutilmoqda</option><option value="berildi">Berildi</option><option value="bekor">Bekor</option><option value="tanlash">Bot tanlanmagan</option><option value="kupon">Kupon berildi</option></Select>}
          bodyClass="p-0 sm:p-0">
          <Table rows={data.spins} empty={<Empty title="Hali aylantirilmagan" />} columns={[
            { key: 'created_at', title: 'Vaqt', render: (s) => <span className="tabular whitespace-nowrap text-muted">{s.created_at}</span> },
            { key: 'user', title: 'Foydalanuvchi', render: (s) => <div><p className="font-medium">{s.ism || '—'}</p><p className="text-xs text-muted">{s.user_id}</p></div> },
            { key: 'p', title: "Sovg'a", render: (s) => <div className="flex items-center gap-2"><PrizeIcon p={s} size={30} /><span>{s.nomi}</span></div> },
            { key: 'h', title: 'Holat', render: (s) => { const [l, t] = HOLAT[s.holat] || HOLAT.berildi; return s.turi === 'bosh' ? <span className="text-muted">—</span> : <div><Badge tone={t}>{l}</Badge>{s.izoh && <p className="mt-1 max-w-[220px] truncate text-xs text-muted" title={s.izoh}>{s.izoh}</p>}</div>; } },
            { key: 'a', title: '', align: 'right', render: (s) => (s.holat === 'tanlash' ? (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="primary" icon={CalendarPlus} loading={busy === `b${s.id}`} onClick={async () => {
                  const bot = window.prompt(`Foydalanuvchining qaysi botiga +${s.qiymat} kun qo'shilsin? Bot username:`);
                  if (bot && bot.trim()) post(`b${s.id}`, { action: 'spin_status', id: s.id, holat: 'berildi', izoh: bot.trim() });
                }}>Botga berish</Button>
                <Button size="sm" loading={busy === `x${s.id}`} onClick={async () => { if (await confirm({ text: 'Sovg‘a bekor qilinsinmi?', danger: true })) post(`x${s.id}`, { action: 'spin_status', id: s.id, holat: 'bekor' }); }}>Bekor</Button>
              </div>
            ) : s.holat === 'kutilmoqda' ? (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="primary" icon={Check} loading={busy === `b${s.id}`} onClick={() => post(`b${s.id}`, { action: 'spin_status', id: s.id, holat: 'berildi' })}>Berildi</Button>
                <Button size="sm" loading={busy === `x${s.id}`} onClick={async () => { if (await confirm({ text: 'Sovg‘a bekor qilinsinmi?', danger: true })) post(`x${s.id}`, { action: 'spin_status', id: s.id, holat: 'bekor' }); }}>Bekor</Button>
              </div>
            ) : null) },
          ]} />
        </Card>
      )}

      {tab === 'settings' && (
        <div className="space-y-6">
          <SettingsCard key={JSON.stringify(data.settings)} s={data.settings} onSaved={apply} />
          <TicketsCard onSaved={apply} />
        </div>
      )}

      {edit && <PrizeModal prize={edit.id ? edit : null} types={data.types} scopes={data.scopes} plans={data.plans} onClose={() => setEdit(null)} onSaved={apply} />}
    </div>
  );
}
