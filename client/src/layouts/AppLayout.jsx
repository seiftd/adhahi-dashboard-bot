import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const navItems = [
  { id: 'dashboard', label: 'الرئيسية', icon: '📊' },
  { id: 'user', label: 'معلوماتي', icon: '👤' },
  { id: 'control', label: 'التحكم', icon: '🎛️' },
  { id: 'logs', label: 'السجلات', icon: '📜' }
];

export function AppLayout({ pages }) {
  const [active, setActive] = useState('dashboard');
  const status = useAppStore((state) => state.status);

  return (
    <main className="min-h-screen bg-aurora px-4 pb-24 pt-5 font-cairo text-slate-100 md:px-8 md:pb-8" dir="rtl">
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-cyan-300">Adhahi DZ Bot</p>
            <h1 className="mt-1 text-2xl font-black text-white md:text-4xl">لوحة مراقبة أضاحي الجزائر</h1>
          </div>
          <div className="glass rounded-2xl px-4 py-3 text-left">
            <span className="block text-xs text-slate-400">حالة المراقبة</span>
            <strong className={status.monitoring ? 'text-emerald-300' : 'text-amber-200'}>{status.monitoring ? 'نشطة' : 'متوقفة'}</strong>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
          <aside className="glass sticky top-5 hidden h-fit rounded-[2rem] p-3 lg:block">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right font-bold transition ${
                  active === item.id ? 'bg-cyan-400 text-slate-950 shadow-glow' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </aside>

          <motion.section key={active} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28 }}>
            {pages[active]}
          </motion.section>
        </div>
      </div>

      <nav className="fixed bottom-3 left-3 right-3 z-30 grid grid-cols-4 gap-2 rounded-[1.6rem] border border-white/10 bg-slate-950/85 p-2 shadow-glow backdrop-blur lg:hidden">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setActive(item.id)} className={`rounded-2xl py-3 text-xs font-black ${active === item.id ? 'bg-cyan-400 text-slate-950' : 'text-slate-300'}`}>
            <span className="mb-1 block text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
