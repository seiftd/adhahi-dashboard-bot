import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import './styles/index.css';
import { monitoringApi } from './services/api';

function formatDate(value) {
  if (!value) return 'لا يوجد';
  return new Intl.DateTimeFormat('ar-DZ', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date(value));
}

function availabilityLabel(status) {
  if (status.checking) return { text: '⏳ جاري الفحص', className: 'text-amber-200 bg-amber-400/10' };
  if (status.available) return { text: '🟢 متوفر', className: 'text-emerald-200 bg-emerald-400/10' };
  return { text: '🔴 غير متوفر', className: 'text-rose-200 bg-rose-400/10' };
}

export default function App() {
  const [status, setStatus] = useState({
    monitoring: false,
    lastCheck: null,
    available: false,
    checking: false,
    targetWilaya: 'سوق أهراس',
    hasScreenshot: false,
    lastScreenshotAt: null,
    lastError: null
  });
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [screenshotVersion, setScreenshotVersion] = useState(Date.now());

  const availability = useMemo(() => availabilityLabel(status), [status]);

  async function refresh() {
    try {
      const nextStatus = await monitoringApi.getStatus();
      setStatus(nextStatus);
      setError('');
      if (nextStatus.hasScreenshot) setScreenshotVersion(Date.now());
    } catch (requestError) {
      setError('تعذر الاتصال بسيرفر Railway');
    }
  }

  async function runAction(action) {
    setLoading(action);
    setError('');
    try {
      const nextStatus = action === 'start' ? await monitoringApi.start() : await monitoringApi.stop();
      setStatus(nextStatus);
    } catch (requestError) {
      setError('فشل تنفيذ الأمر، تحقق من السيرفر');
    } finally {
      setLoading('');
    }
  }

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();
    }

    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-aurora px-4 py-6 font-cairo text-slate-100" dir="rtl">
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:42px_42px]" />

      <section className="relative mx-auto max-w-4xl">
        <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
          <p className="text-sm font-bold text-cyan-300">Adhahi DZ Monitor</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-5xl">مراقبة توفر سوق أهراس</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            النظام يراقب صفحة أضاحي فقط، ولا يقوم بأي تسجيل أو تعبئة بيانات. عند التوفر يتم إرسال تنبيهات وصورة شاشة عبر Telegram.
          </p>
        </motion.header>

        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass neon-border rounded-[2rem] p-5 md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white/5 p-5">
              <span className="text-sm text-slate-400">حالة المراقبة</span>
              <strong className={status.monitoring ? 'mt-3 block text-2xl text-emerald-300' : 'mt-3 block text-2xl text-amber-200'}>
                {status.monitoring ? 'تعمل' : 'متوقفة'}
              </strong>
            </div>

            <div className="rounded-3xl bg-white/5 p-5">
              <span className="text-sm text-slate-400">حالة التوفر</span>
              <strong className={`mt-3 inline-flex rounded-2xl px-4 py-2 text-lg ${availability.className}`}>{availability.text}</strong>
            </div>

            <div className="rounded-3xl bg-white/5 p-5">
              <span className="text-sm text-slate-400">آخر فحص</span>
              <strong className="mt-3 block text-lg text-cyan-100">{formatDate(status.lastCheck)}</strong>
            </div>
          </div>

          {error && <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-center font-bold text-rose-100">{error}</div>}
          {status.lastError && <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-center text-sm text-amber-100">{status.lastError}</div>}

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <button
              onClick={() => runAction('start')}
              disabled={loading === 'start'}
              className="rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 shadow-glow transition hover:bg-cyan-300 disabled:opacity-60"
            >
              {loading === 'start' ? 'جارٍ البدء...' : 'بدء المراقبة'}
            </button>
            <button
              onClick={() => runAction('stop')}
              disabled={loading === 'stop'}
              className="rounded-2xl bg-rose-500 px-5 py-4 font-black text-white transition hover:bg-rose-400 disabled:opacity-60"
            >
              {loading === 'stop' ? 'جارٍ الإيقاف...' : 'إيقاف المراقبة'}
            </button>
            <button
              onClick={refresh}
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-black text-white transition hover:bg-white/15"
            >
              تحديث الحالة
            </button>
          </div>

          {status.hasScreenshot && (
            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-white">آخر لقطة شاشة</h2>
                <span className="text-xs text-slate-400">{formatDate(status.lastScreenshotAt)}</span>
              </div>
              <img
                src={`${monitoringApi.screenshotUrl()}?v=${screenshotVersion}`}
                alt="آخر لقطة شاشة من موقع أضاحي"
                className="max-h-[520px] w-full rounded-3xl border border-cyan-300/20 object-contain shadow-glow"
              />
            </div>
          )}
        </motion.div>
      </section>
    </main>
  );
}
