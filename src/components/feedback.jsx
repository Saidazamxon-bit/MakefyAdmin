import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Modal, cx } from './ui';

const Ctx = createContext(null);

/** Toast bildirishnomalar + tasdiqlash oynasi (confirm). */
export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dlg, setDlg] = useState(null);
  const resolver = useRef(null);

  const toast = useCallback((text, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'bad' ? 6000 : 3500);
  }, []);

  const confirm = useCallback((opts) => new Promise((res) => {
    resolver.current = res;
    setDlg(typeof opts === 'string' ? { text: opts } : opts);
  }), []);

  const close = (v) => { resolver.current?.(v); resolver.current = null; setDlg(null); };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={cx('animate-in pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg',
            t.tone === 'bad' ? 'border-bad/30 bg-bad-soft text-bad' : 'border-line bg-surface text-fg')}>
            {t.tone === 'bad' ? <XCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
      <Modal
        open={!!dlg}
        onClose={() => close(false)}
        title={dlg?.title || 'Tasdiqlang'}
        footer={<>
          <Button onClick={() => close(false)}>Bekor qilish</Button>
          <Button variant={dlg?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{dlg?.ok || 'Ha, davom etish'}</Button>
        </>}
      >
        <div className="flex gap-3 text-sm">
          {dlg?.danger && <AlertTriangle className="mt-0.5 size-5 shrink-0 text-bad" />}
          <p className="leading-relaxed">{dlg?.text}</p>
        </div>
      </Modal>
    </Ctx.Provider>
  );
}

export function useFeedback() {
  return useContext(Ctx);
}

/** Amalni bajarish: loading holati, muvaffaqiyat/xato toast. run(fn) → natija yoki null */
export function useAction() {
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(null);
  const run = useCallback(async (key, fn, { success } = {}) => {
    setBusy(key);
    try {
      const r = await fn();
      const msg = success ?? r?.message;
      if (msg) toast(msg);
      return r ?? true;
    } catch (e) {
      toast(e.message || 'Xatolik', 'bad');
      return null;
    } finally {
      setBusy(null);
    }
  }, [toast]);
  return { busy, run };
}
