import { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { apiService } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../utils/format';

const levels = ['ALL', 'info', 'success', 'warning', 'error'];

export function Logs() {
  const logs = useAppStore((state) => state.logs);
  const clearLogs = useAppStore((state) => state.clearLogs);
  const notify = useAppStore((state) => state.notify);
  const [level, setLevel] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => logs.filter((log) => (level === 'ALL' || log.level === level) && log.message.includes(search)),
    [logs, level, search]
  );

  async function clear() {
    await apiService.clearLogs();
    clearLogs();
    notify({ type: 'success', message: 'تم مسح السجلات' });
  }

  return (
    <section className="glass neon-border rounded-[2rem] p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">صفحة السجلات</h2>
          <p className="text-sm text-slate-400">سجلات مباشرة مع فلترة وبحث.</p>
        </div>
        <Button variant="danger" onClick={clear}>مسح السجلات</Button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث داخل السجلات..." className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none focus:border-cyan-300" />
        <div className="flex flex-wrap gap-2">
          {levels.map((item) => (
            <button key={item} onClick={() => setLevel(item)} className={`rounded-2xl px-3 py-2 text-xs font-black ${level === item ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-slate-300'}`}>{item}</button>
          ))}
        </div>
      </div>

      <div className="rtl-scroll max-h-[62vh] space-y-3 overflow-y-auto pl-2">
        {filtered.map((log) => (
          <article key={log.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-200">{log.level.toUpperCase()}</span>
              <time className="text-xs text-slate-500">{formatDate(log.createdAt)}</time>
            </div>
            <p className="mt-2 text-slate-100">{log.message}</p>
          </article>
        ))}
        {!filtered.length && <p className="rounded-3xl bg-white/5 p-6 text-center text-slate-400">لا توجد نتائج مطابقة</p>}
      </div>
    </section>
  );
}
