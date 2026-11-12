import { useState } from 'react';
import { Check, Copy, ExternalLink, Link2 } from 'lucide-react';
import { useFeedback } from '../components/feedback';
import { Button, Card, Field, Input, PageHeader } from '../components/ui';

/*
 * Telegram Mini App DIRECT LINKS: https://t.me/Makefybot/app?startapp=<kalit>
 * Har bir bo'lim Telegram ICHIDA ochiladi (brauzerga chiqib ketmaydi). Kanal, post, bot xabari, reklama — istalgan joyga qo'yiladi.
 * Ro'yxat sayt (src/lib/directLinks.js) va backend (includes/direct_links.php) bilan bir xil.
 */
const BASE = 'https://t.me/Makefybot/app';
const SECTIONS = [
  ['home', '/dashboard', 'Bosh sahifa'], ['bots', '/bots', 'Botlarim'], ['create', '/create', 'Bot yaratish'],
  ['ai', '/ai', 'AI bilan bot yaratish'], ['analytics', '/analytics', 'Tahlil'], ['hamyon', '/hamyon', 'Hamyon'],
  ['deposit', '/deposit', "Hisobni to'ldirish"], ['baraban', '/baraban', 'Baraban'], ['referal', '/referal', 'Referal'],
  ['tariflar', '/tariflar', 'Tariflar'], ['vazifalar', '/vazifalar', 'Vazifalar (pul ishlash)'], ['market', '/market', 'Bozor'],
  ['yordam', '/yordam', 'Yordam markazi'], ['profil', '/profil', 'Profil'], ['sozlamalar', '/sozlamalar', 'Sozlamalar'],
  ['developer', '/developer', 'Dasturchilar (API)'],
];
const SEG = /^[A-Za-z0-9_-]{1,40}$/;

/** Ixtiyoriy sahifa yo'li → direct link (masalan /bots/MyBot yoki /create/anime) */
function linkFor(path) {
  const clean = '/' + String(path || '').trim().replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+|\/+$/g, '').split(/[?#]/)[0];
  const hit = SECTIONS.find((s) => s[1] === clean);
  if (hit) return `${BASE}?startapp=${hit[0]}`;
  const segs = clean.split('/').filter(Boolean);
  if (!segs.length || !segs.every((s) => SEG.test(s))) return '';
  const v = 'go--' + segs.join('--');
  return v.length <= 64 ? `${BASE}?startapp=${v}` : '';
}

function CopyRow({ title, path, url }) {
  const { toast } = useFeedback();
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 1500); } catch { toast("Nusxalab bo'lmadi", 'bad'); }
  };
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title} <span className="text-xs font-normal text-muted">{path}</span></p>
        <p className="truncate font-mono text-xs text-muted">{url}</p>
      </div>
      <div className="flex gap-1">
        <a href={url} target="_blank" rel="noreferrer"><Button size="icon" variant="ghost" icon={ExternalLink} aria-label="Ochish" /></a>
        <Button size="sm" icon={ok ? Check : Copy} onClick={copy}>{ok ? 'Nusxalandi' : 'Nusxalash'}</Button>
      </div>
    </div>
  );
}

export default function DirectLinks() {
  const [path, setPath] = useState('/bots/');
  const custom = linkFor(path);
  return (
    <div className="animate-in space-y-6">
      <PageHeader title="Direct linklar" description="Saytning har bir bo'limi uchun Telegram Mini App havolasi — bosilganda bo'lim Telegramning o'zida ochiladi, brauzerga chiqib ketmaydi. Botda /web buyrug'i ham shu ro'yxatni chiqaradi." />
      <Card title="Bo'limlar" subtitle={`${BASE}?startapp=<kalit>`}>
        {SECTIONS.map(([k, p, title]) => <CopyRow key={k} title={title} path={p} url={`${BASE}?startapp=${k}`} />)}
      </Card>
      <Card title={<span className="flex items-center gap-2"><Link2 className="size-4" /> Istalgan sahifa uchun</span>} subtitle="Masalan: /bots/MyShopBot, /create/anime, /market/kino, /bots/MyBot/tolov">
        <Field label="Sahifa yo'li yoki sayt havolasi"><Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/bots/MyBot" /></Field>
        <div className="mt-3">
          {custom ? <CopyRow title="Havola" path={path} url={custom} /> : <p className="text-sm text-bad">Yo'l noto'g'ri yoki juda uzun (64 belgigacha; faqat lotin harf, raqam, _ va -).</p>}
        </div>
      </Card>
    </div>
  );
}
