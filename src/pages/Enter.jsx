import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button, Loading } from '../components/ui';

/** /enter?token=<64 hex> — botdagi /panelweb havolasi. Tokenni sessiyaga almashtiradi. */
export default function Enter() {
  const [params] = useSearchParams();
  const { exchange } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState('');
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return; // StrictMode'da ikki marta chaqirilmasin — token bir martalik
    once.current = true;
    const token = (params.get('token') || '').trim().toLowerCase();
    window.history.replaceState(null, '', '/enter'); // token manzil satrida/tarixda qolmasin
    if (!/^[a-f0-9]{64}$/.test(token)) { setError("Havola noto'g'ri."); return; }
    exchange(token)
      .then((s) => (s?.admin ? nav('/', { replace: true }) : setError('Kirib bo‘lmadi.')))
      .catch((e) => setError(e.message));
  }, [params, exchange, nav]);

  if (!error) return <Loading text="Kirilmoqda…" />;
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7 text-center shadow-xl">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-bad-soft text-bad"><ShieldAlert className="size-6" /></span>
        <h1 className="font-semibold">Havola yaroqsiz yoki eskirgan</h1>
        <p className="mt-2 text-sm text-muted">{error} Botga qaytib, <b>/panelweb</b> deb qayta yozing.</p>
        <Link to="/login" className="mt-5 inline-block"><Button>Ortga</Button></Link>
      </div>
    </div>
  );
}
