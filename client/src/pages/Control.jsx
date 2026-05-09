import { useState } from 'react';
import { Button } from '../components/Button';
import { apiService } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export function Control() {
  const status = useAppStore((state) => state.status);
  const setStatus = useAppStore((state) => state.setStatus);
  const notify = useAppStore((state) => state.notify);
  const [loading, setLoading] = useState('');

  async function run(action, label) {
    setLoading(action);
    try {
      const next = await apiService[action]();
      setStatus(next);
      notify({ type: 'success', message: label });
    } catch (error) {
      notify({ type: 'error', message: error.message });
    } finally {
      setLoading('');
    }
  }

  return (
    <section className="glass neon-border rounded-[2rem] p-5">
      <h2 className="text-2xl font-black text-white">صفحة التحكم</h2>
      <p className="mt-2 text-slate-400">تحكم مباشر في مراقبة ولاية سوق أهراس.</p>

      <div className="my-6 rounded-[2rem] border border-white/10 bg-slate-950/55 p-5">
        <span className="text-sm text-slate-400">الحالة الحالية</span>
        <p className={`mt-2 text-2xl font-black ${status.monitoring ? 'text-emerald-300' : 'text-amber-200'}`}>{status.monitoring ? 'المراقبة تعمل الآن' : 'المراقبة متوقفة'}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Button disabled={loading === 'start'} onClick={() => run('start', 'تم بدء المراقبة')}>▶ بدء المراقبة</Button>
        <Button variant="danger" disabled={loading === 'stop'} onClick={() => run('stop', 'تم إيقاف المراقبة')}>⏹ إيقاف المراقبة</Button>
        <Button variant="purple" disabled={loading === 'restart'} onClick={() => run('restart', 'تمت إعادة التشغيل')}>🔄 إعادة تشغيل</Button>
        <Button variant="ghost" disabled={loading === 'status'} onClick={() => run('status', 'تم تحديث الحالة')}>🔄 تحديث الحالة</Button>
      </div>
    </section>
  );
}
