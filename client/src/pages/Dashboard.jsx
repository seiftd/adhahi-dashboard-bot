import { StatCard } from '../components/StatCard';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../utils/format';

export function Dashboard() {
  const status = useAppStore((state) => state.status);
  const logs = useAppStore((state) => state.logs);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="حالة السيرفر" value={status.server === 'online' ? 'يعمل' : status.server} icon="🖥️" tone="green" />
        <StatCard title="حالة Playwright" value={status.playwright} icon="🎭" tone="purple" />
        <StatCard title="حالة البوت" value={status.bot === 'online' ? 'متصل' : status.bot} icon="🤖" tone="cyan" />
        <StatCard title="حالة المراقبة" value={status.monitoring ? 'نشطة' : 'متوقفة'} icon="📡" tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <section className="glass neon-border rounded-[2rem] p-5">
          <h2 className="text-xl font-black text-white">حالة التسجيل</h2>
          <p className="mt-3 rounded-3xl bg-cyan-400/10 p-5 text-lg font-extrabold text-cyan-100">{status.registration}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/5 p-4"><span className="text-slate-400">آخر فحص</span><strong className="mt-2 block">{formatDate(status.lastCheck)}</strong></div>
            <div className="rounded-3xl bg-white/5 p-4"><span className="text-slate-400">سرعة الفحص</span><strong className="mt-2 block">{status.checkSpeed}ms</strong></div>
            <div className="rounded-3xl bg-white/5 p-4"><span className="text-slate-400">عدد المحاولات</span><strong className="mt-2 block">{status.attempts}</strong></div>
          </div>
        </section>

        <section className="glass rounded-[2rem] p-5">
          <h2 className="mb-4 text-xl font-black text-white">السجلات المباشرة</h2>
          <div className="rtl-scroll max-h-72 space-y-3 overflow-y-auto pl-2">
            {logs.slice(0, 8).map((log) => (
              <div key={log.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-cyan-300">{log.level.toUpperCase()}</span>
                  <time className="text-xs text-slate-500">{formatDate(log.createdAt)}</time>
                </div>
                <p className="mt-1 text-sm text-slate-200">{log.message}</p>
              </div>
            ))}
            {!logs.length && <p className="rounded-2xl bg-white/5 p-4 text-center text-slate-400">لا توجد سجلات بعد</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
