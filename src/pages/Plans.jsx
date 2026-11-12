import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../lib/hooks';
import { num } from '../lib/format';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, ErrorBox, Field, Input, Loading, Modal, PageHeader, Switch, cx } from '../components/ui';

/*
 * Platforma (hisob) tariflari — backend: api/panel/plans.php.
 * Har bir imtiyoz serverda haqiqatan ishlaydi:
 *   chegirma + chegirma_tariflar → bot tariflari narxi (botOylikEff), faqat tanlangan bot tariflariga
 *   referal_bonus_foiz → referal mukofoti, bot_bonus_kun → bot yaratganda qo'shimcha kun, ai_limit → AI bilan bot yaratish tokenlari
 *   otkazish → botni boshqaga o'tkazish, chat_rasm → yordam chatida rasm, token_yangila → bot tokenini komissiyasiz almashtirish
 */

function TariffPicker({ all, value, onChange }) {
  const isAll = value === '*';
  const sel = isAll ? [] : (Array.isArray(value) ? value : []);
  const toggle = (k) => onChange(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k]);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange(isAll ? [] : '*')}
          className={cx('rounded-full border px-3 py-1 text-sm', isAll ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:bg-surface-2')}>
          Barcha bot tariflari
        </button>
        {all.map((b) => {
          const on = isAll || sel.includes(b.kalit);
          return (
            <button key={b.kalit} type="button" disabled={isAll} onClick={() => toggle(b.kalit)}
              className={cx('rounded-full border px-3 py-1 text-sm disabled:opacity-60', on ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:bg-surface-2')}>
              {b.nomi}
            </button>
          );
        })}
      </div>
      {!isAll && sel.length === 0 && <p className="text-xs text-warn">Hech qaysi bot tarifi tanlanmagan — chegirma ishlamaydi.</p>}
    </div>
  );
}

function PlanCard({ p, botTariffs, onSaved }) {
  const [f, setF] = useState(p);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const { busy, run } = useAction();
  const { confirm } = useFeedback();
  const save = async () => { if (await run('s', () => api.post('panel/plans', { action: 'save_plan', ...f }))) onSaved(); };
  const del = async () => {
    if (!(await confirm({ text: `«${p.nomi}» tarifi o'chirilsinmi?`, danger: true }))) return;
    if (await run('d', () => api.post('panel/plans', { action: 'delete_plan', id: p.id }))) onSaved();
  };
  return (
    <Card
      title={<span className="flex items-center gap-2">{p.nomi}<Badge tone="brand">{p.kalit}</Badge></span>}
      subtitle={`${num(p.users)} ta faol obunachi`}
      actions={(
        <div className="flex gap-1">
          {p.users === 0 && <Button size="icon" variant="ghost" icon={Trash2} aria-label="O'chirish" loading={busy === 'd'} onClick={del} />}
          <Button size="sm" variant="primary" loading={busy === 's'} onClick={save}>Saqlash</Button>
        </div>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomi"><Input value={f.nomi} maxLength={40} onChange={set('nomi')} /></Field>
        <Field label="Narxi (so'm)"><Input type="number" min="0" value={f.narxi} onChange={set('narxi')} /></Field>
        <Field label="Muddati (kun)"><Input type="number" min="1" value={f.muddat_kun} onChange={set('muddat_kun')} /></Field>
        <Field label="Bot tariflariga chegirma (%)" hint="0 = yo'q"><Input type="number" min="0" max="90" value={f.chegirma} onChange={set('chegirma')} /></Field>
      </div>
      {Number(f.chegirma) > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-sm font-medium">Chegirma qaysi bot tariflariga</p>
          <TariffPicker all={botTariffs} value={f.chegirma_tariflar} onChange={set('chegirma_tariflar')} />
          <p className="text-xs text-muted">Barcha bot turlarida (Anime, Kino, Do'kon…) shu tariflarga qo'llanadi. Shablon narxiga chegirma yo'q.</p>
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Referal bonusiga qo'shimcha (%)"><Input type="number" min="0" value={f.referal_bonus_foiz} onChange={set('referal_bonus_foiz')} /></Field>
        <Field label="Yangi botga bonus kun"><Input type="number" min="0" value={f.bot_bonus_kun} onChange={set('bot_bonus_kun')} /></Field>
        <Field label="AI token limiti / oy" hint="0 = standart"><Input type="number" min="0" value={f.ai_limit} onChange={set('ai_limit')} /></Field>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Switch checked={f.otkazish} onChange={set('otkazish')} label="Botni boshqaga o'tkazish" />
        <Switch checked={f.chat_rasm} onChange={set('chat_rasm')} label="Yordam chatida rasm yuborish" />
        <Switch checked={f.token_yangila} onChange={set('token_yangila')} label="Bot tokenini komissiyasiz almashtirish" />
      </div>
    </Card>
  );
}

function NewPlan({ onClose, onSaved }) {
  const [f, setF] = useState({ kalit: '', nomi: '' });
  const { busy, run } = useAction();
  const create = async () => { if (await run('c', () => api.post('panel/plans', { action: 'create_plan', ...f }))) { onSaved(); onClose(); } };
  return (
    <Modal open onClose={onClose} title="Yangi tarif" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" loading={busy === 'c'} onClick={create}>Qo'shish</Button></>}>
      <div className="space-y-4">
        <Field label="Nomi" hint="Saytda ko'rinadi, masalan: Biznes"><Input value={f.nomi} maxLength={40} onChange={(e) => setF((x) => ({ ...x, nomi: e.target.value }))} /></Field>
        <Field label="Kalit" hint="Lotin harf, raqam, _ — keyin o'zgarmaydi (masalan: biznes)">
          <Input value={f.kalit} maxLength={20} onChange={(e) => setF((x) => ({ ...x, kalit: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} />
        </Field>
        <p className="text-sm text-muted">Tarif 0 so'm va imtiyozsiz yaratiladi; qo'shilgach narx va imtiyozlarini kiriting. Limitlar «Start» tarifidan nusxalanadi.</p>
      </div>
    </Modal>
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
  const [adding, setAdding] = useState(false);
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} onRetry={reload} />;
  const botTariffs = data.botTariffs || [];
  return (
    <div className="animate-in space-y-6">
      <PageHeader
        title="Platforma tariflari"
        description="Hisob obunalari: narx, imtiyozlar va limitlar. Belgilangan har bir imtiyoz saytda va botda haqiqatan qo'llanadi."
        actions={<Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>Yangi tarif</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        {data.plans.map((p) => <PlanCard key={`${p.id}-${p.nomi}`} p={p} botTariffs={botTariffs} onSaved={() => reload(true)} />)}
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
      {adding && <NewPlan onClose={() => setAdding(false)} onSaved={() => reload(true)} />}
    </div>
  );
}
