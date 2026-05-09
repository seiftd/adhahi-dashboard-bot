import { motion } from 'framer-motion';

export function StatCard({ title, value, icon, tone = 'cyan' }) {
  const tones = {
    cyan: 'from-cyan-400/20 to-sky-500/5 text-cyan-200',
    purple: 'from-purple-400/20 to-fuchsia-500/5 text-purple-200',
    green: 'from-emerald-400/20 to-green-500/5 text-emerald-200',
    amber: 'from-amber-400/20 to-orange-500/5 text-amber-200'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass neon-border rounded-3xl p-4"
    >
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]}`}>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="mt-2 text-xl font-black text-white">{value}</h3>
    </motion.div>
  );
}
