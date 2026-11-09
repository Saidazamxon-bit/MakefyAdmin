import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, User } from 'lucide-react';
import { api, mediaUrl, qs } from '../lib/api';
import { useApi, useDebounced } from '../lib/hooks';
import { ago } from '../lib/format';
import { useFeedback } from '../components/feedback';
import { Avatar, Button, Empty, Loading, PageHeader, SearchInput, cx } from '../components/ui';

function Thread({ uid, onSent }) {
  const [msgs, setMsgs] = useState([]);
  const [user, setUser] = useState(null);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const lastId = useRef(0);
  const box = useRef(null);
  const { toast } = useFeedback();

  useEffect(() => {
    let alive = true;
    lastId.current = 0;
    setMsgs([]);
    setLoading(true);
    const tick = async () => {
      try {
        const d = await api.get(`panel/chat${qs({ uid, after: lastId.current || undefined })}`);
        if (!alive) return;
        setUser(d.user);
        setTyping(d.typing);
        if (d.messages.length) {
          lastId.current = d.messages[d.messages.length - 1].id;
          setMsgs((m) => [...m, ...d.messages.filter((x) => !m.some((y) => y.id === x.id))]);
        }
      } catch { /* keyingi urinishda */ } finally { if (alive) setLoading(false); }
    };
    tick();
    const t = setInterval(() => { if (!document.hidden) tick(); }, 4000);
    return () => { alive = false; clearInterval(t); };
  }, [uid]);

  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [msgs.length]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const r = await api.post('panel/chat', { uid, text: t });
      if (r.message) {
        lastId.current = Math.max(lastId.current, r.message.id);
        setMsgs((m) => [...m, r.message]);
      }
      setText('');
      onSent?.();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Link to="/chat" className="rounded-md p-1 text-muted hover:bg-surface-2 md:hidden" aria-label="Ortga"><ArrowLeft className="size-5" /></Link>
        <Avatar name={user?.name} src={user?.avatar} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user?.name || uid}</p>
          <p className="text-xs text-muted">{typing ? 'yozmoqda…' : `ID: ${uid}`}</p>
        </div>
        <Link to={`/users/${uid}`}><Button size="sm" icon={User}>Profil</Button></Link>
      </div>
      <div ref={box} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-surface-2/50 px-4 py-4">
        {loading && <Loading />}
        {!loading && !msgs.length && <Empty title="Xabarlar yo'q" text="Birinchi bo'lib yozing." />}
        {msgs.map((m) => {
          const mine = m.kim === 'admin';
          return (
            <div key={m.id} className={cx('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className={cx('max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%]', mine ? 'rounded-br-md bg-brand text-brand-fg' : 'rounded-bl-md border border-line bg-surface')}>
                {(m.rasmlar || []).map((src) => <a key={src} href={mediaUrl(src)} target="_blank" rel="noreferrer"><img src={mediaUrl(src)} alt="" className="mb-1.5 max-h-60 rounded-lg" /></a>)}
                <p className="whitespace-pre-wrap break-words">{m.matn}</p>
                {m.actions?.length > 0 && <p className={cx('mt-1 text-xs', mine ? 'text-brand-fg/80' : 'text-muted')}>[{m.actions.map((a) => a.label).join(' · ')}]</p>}
                <p className={cx('mt-1 text-right text-[10px]', mine ? 'text-brand-fg/70' : 'text-muted')}>{m.sana_label || m.vaqt}{mine && (m.oqildi ? ' ✓✓' : ' ✓')}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}
          placeholder="Javob yozing… (Shift+Enter — yangi qator)"
          className="max-h-40 min-h-10 flex-1 resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <Button type="submit" variant="primary" icon={Send} loading={sending} aria-label="Yuborish" />
      </form>
    </div>
  );
}

export default function Chat() {
  const { uid } = useParams();
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const nav = useNavigate();
  const { data, loading, reload } = useApi(`panel/chat${qs({ q: dq })}`, { interval: 15000 });
  const threads = data?.threads || [];

  return (
    <div className="animate-in">
      <PageHeader title="Chat" description="Foydalanuvchilar bilan yozishmalar (WebApp ichidagi «Admin» chati)." />
      <div className="grid h-[calc(100vh-13rem)] min-h-[480px] overflow-hidden rounded-xl border border-line bg-surface md:grid-cols-[320px_1fr]">
        <div className={cx('flex min-h-0 flex-col border-r border-line', uid && 'max-md:hidden')}>
          <div className="border-b border-line p-3"><SearchInput value={q} onChange={setQ} placeholder="Ism yoki ID" /></div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {loading && !data && <Loading />}
            {threads.map((t) => (
              <li key={t.userId}>
                <button type="button" onClick={() => nav(`/chat/${t.userId}`)} className={cx('flex w-full items-start gap-3 border-b border-line px-3 py-3 text-left transition hover:bg-surface-2', uid === t.userId && 'bg-brand-soft')}>
                  <Avatar name={t.name || t.userId} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{t.name || t.userId}</p>
                      <span className="shrink-0 text-[11px] text-muted">{ago(t.lastAt)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="flex-1 truncate text-xs text-muted">{t.lastFrom === 'admin' && 'Siz: '}{t.lastText}</p>
                      {t.unread > 0 && <span className="tabular rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-fg">{t.unread}</span>}
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {!loading && !threads.length && <Empty title="Suhbatlar yo'q" />}
          </ul>
        </div>
        <div className={cx('min-h-0', !uid && 'max-md:hidden')}>
          {uid ? <Thread key={uid} uid={uid} onSent={() => reload(true)} /> : <Empty icon={MessageSquare} title="Suhbatni tanlang" text="Chapdagi ro'yxatdan foydalanuvchini tanlang." />}
        </div>
      </div>
    </div>
  );
}
