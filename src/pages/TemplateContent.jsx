import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, RotateCcw, Save, Trash2, Undo2 } from 'lucide-react';
import { api, mediaUrl } from '../lib/api';
import { useApi } from '../lib/hooks';
import { useAction, useFeedback } from '../components/feedback';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, PageHeader, Textarea, cx } from '../components/ui';

/*
 * Shablon katalogi (backend: api/panel/template_meta.php, includes/template_admin.php).
 * Saytdagi «Bozor» / «Bot yaratish» kartasi va shablon sahifasidagi barcha matnlar hamda logotip ikonkasi.
 * Narx va limitlar — «Bot tariflari» bo'limida.
 */

const lines = (a) => (Array.isArray(a) ? a.join('\n') : '');
const toList = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

/** Rasmni brauzerda 256×256 (kvadrat, markazdan kesib) PNG ga keltiradi — server 600 KB / 1024 px chegarasidan oshmaydi. */
function fileToIcon(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.type)) { reject(new Error('PNG, JPG, WEBP yoki SVG rasm tanlang.')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      const s = Math.min(img.naturalWidth || size, img.naturalHeight || size);
      const sx = ((img.naturalWidth || size) - s) / 2;
      const sy = ((img.naturalHeight || size) - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Rasmni o'qib bo'lmadi.")); };
    img.src = url;
  });
}

function TileIcon({ t, size = 44 }) {
  return t.iconUrl
    ? <img src={mediaUrl(t.iconUrl)} alt="" className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} />
    : <span className="grid shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl" style={{ width: size, height: size }}>{t.icon || '🤖'}</span>;
}

function Editor({ t, onUpdated }) {
  const init = () => ({
    name: t.name || '', icon: t.icon || '', category: t.category || '', description: t.description || '', earn: t.earn || '',
    highlights: lines(t.highlights), tags: (t.tags || []).join(', '), buttons: lines(t.buttons),
    features: (t.features || []).map((f) => ({ icon: f.icon || '', title: f.title || '', desc: f.desc || '' })),
  });
  const [f, setF] = useState(init);
  useEffect(() => { setF(init()); }, [t.slug]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setFeat = (i, k, v) => setF((x) => ({ ...x, features: x.features.map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const { busy, run } = useAction();
  const { confirm, toast } = useFeedback();
  const fileRef = useRef(null);

  const post = async (key, body) => {
    const r = await run(key, () => api.post('panel/template_meta', { slug: t.slug, ...body }));
    if (r?.templates) onUpdated(r.templates);
    return r;
  };
  const save = () => post('save', { action: 'save', data: {
    name: f.name, icon: f.icon, category: f.category, description: f.description, earn: f.earn,
    highlights: toList(f.highlights), buttons: toList(f.buttons), tags: f.tags.split(',').map((x) => x.trim()).filter(Boolean),
    features: f.features.filter((x) => x.title.trim()),
  } });
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { await post('icon', { action: 'icon', image: await fileToIcon(file) }); }
    catch (err) { toast(err.message, 'bad'); }
  };

  return (
    <div className="space-y-4">
      <Card title="Logotip ikonkasi" subtitle="Saytdagi katalog kartalari, bot sahifasi va «Botlarim» ro'yxatida ko'rinadi. Rasm avtomatik 256×256 kvadratga keltiriladi.">
        <div className="flex flex-wrap items-center gap-4">
          <TileIcon t={t} size={88} />
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" className="hidden" onChange={onFile} />
            <Button variant="primary" icon={ImagePlus} loading={busy === 'icon'} onClick={() => fileRef.current?.click()}>Rasm yuklash</Button>
            {t.iconUrl && <Button icon={RotateCcw} loading={busy === 'reset'} onClick={async () => { if (await confirm({ text: 'Standart ikonkaga qaytarilsinmi?' })) post('reset', { action: 'icon_reset' }); }}>Standartga qaytarish</Button>}
          </div>
          {t.iconUrl ? <Badge tone="brand">Admin rasmi</Badge> : <Badge>Standart ikonka</Badge>}
        </div>
      </Card>

      <Card title="Matnlar" subtitle="Saqlangach saytda darhol ko'rinadi. Matnlar ham moderatsiya filtridan o'tadi."
        actions={<>
          <Button icon={Undo2} loading={busy === 'undo'} onClick={async () => { if (await confirm({ text: 'Oxirgi saqlashdan oldingi holat tiklansinmi?' })) post('undo', { action: 'undo' }); }}>Oxirgi o'zgarishni bekor qilish</Button>
          <Button variant="primary" icon={Save} loading={busy === 'save'} onClick={save}>Saqlash</Button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px_1fr]">
          <Field label="Nomi"><Input value={f.name} maxLength={80} onChange={set('name')} /></Field>
          <Field label="Emoji" hint="Rasm yo'q joyda"><Input value={f.icon} maxLength={8} onChange={set('icon')} /></Field>
          <Field label="Toifa"><Input value={f.category} maxLength={60} onChange={set('category')} /></Field>
        </div>
        <div className="mt-4 grid gap-4">
          <Field label="Qisqa tavsif" hint={`${f.description.length}/1500 · katalog kartasida va shablon sahifasida`}><Textarea rows={4} value={f.description} maxLength={1500} onChange={set('description')} /></Field>
          <Field label="«Qanday daromad qilish mumkin?»" hint="Bo'sh qolsa — standart matn"><Textarea rows={3} value={f.earn} maxLength={600} onChange={set('earn')} /></Field>
          <Field label="Afzalliklar" hint="Har bir qatorda bittasi (12 tagacha)"><Textarea rows={5} value={f.highlights} onChange={set('highlights')} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Teglar" hint="Vergul bilan: Stars, Premium, Web App"><Input value={f.tags} onChange={set('tags')} /></Field>
            <Field label="Bot tugmalari (namuna)" hint="Har bir qatorda bittasi"><Textarea rows={3} value={f.buttons} onChange={set('buttons')} /></Field>
          </div>
        </div>
      </Card>

      <Card title="Imkoniyatlar" subtitle="Shablon sahifasidagi ikonka + sarlavha + izoh kartalari (16 tagacha)."
        actions={<Button size="sm" icon={Plus} disabled={f.features.length >= 16} onClick={() => setF((x) => ({ ...x, features: [...x.features, { icon: '✨', title: '', desc: '' }] }))}>Qo'shish</Button>}>
        {f.features.length === 0 ? <Empty title="Imkoniyat qo'shilmagan" /> : (
          <div className="space-y-2">
            {f.features.map((r, i) => (
              <div key={i} className="grid items-center gap-2 sm:grid-cols-[70px_1fr_1.6fr_auto]">
                <Input value={r.icon} maxLength={8} onChange={(e) => setFeat(i, 'icon', e.target.value)} aria-label="Emoji" className="text-center" />
                <Input value={r.title} maxLength={60} placeholder="Sarlavha" onChange={(e) => setFeat(i, 'title', e.target.value)} />
                <Input value={r.desc} maxLength={160} placeholder="Izoh" onChange={(e) => setFeat(i, 'desc', e.target.value)} />
                <Button size="icon" variant="ghost" icon={Trash2} aria-label="O'chirish" onClick={() => setF((x) => ({ ...x, features: x.features.filter((_, j) => j !== i) }))} />
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end"><Button variant="primary" icon={Save} loading={busy === 'save'} onClick={save}>Saqlash</Button></div>
      </Card>
    </div>
  );
}

export default function TemplateContent() {
  const { data, error, loading, reload, setData } = useApi('panel/template_meta');
  const [sel, setSel] = useState('');
  if (loading && !data) return <Loading />;
  const list = data?.templates || [];
  const cur = list.find((x) => x.slug === sel) || list[0];
  return (
    <div className="animate-in">
      <PageHeader title="Shablon katalogi" description="Har bir shablonning logotip rasmi va saytdagi barcha matnlari: nom, tavsif, daromad, afzalliklar, imkoniyatlar. Narx va limitlar — «Bot tariflari» bo'limida." />
      <ErrorBox error={error} onRetry={reload} />
      {list.length === 0 && !error ? <Empty title="Shablonlar topilmadi" text="VisionBuilder/marketplace/*/template.json" /> : cur && (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card bodyClass="p-2 sm:p-2">
            <nav className="space-y-1" aria-label="Shablonlar">
              {list.map((t) => (
                <button key={t.slug} type="button" onClick={() => setSel(t.slug)}
                  className={cx('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors', t.slug === cur.slug ? 'bg-brand-soft text-brand' : 'hover:bg-surface-2')}>
                  <TileIcon t={t} size={36} />
                  <span className="min-w-0"><span className="block truncate text-sm font-medium">{t.name}</span><span className="block truncate text-xs text-muted">{t.slug}</span></span>
                </button>
              ))}
            </nav>
          </Card>
          <Editor key={cur.slug} t={cur} onUpdated={(templates) => setData((d) => ({ ...d, templates }))} />
        </div>
      )}
    </div>
  );
}
