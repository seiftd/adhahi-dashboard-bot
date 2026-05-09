import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export function Toast() {
  const toast = useAppStore((state) => state.toast);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-2xl border border-cyan-300/20 bg-slate-950/90 p-4 text-center font-bold text-white shadow-glow backdrop-blur"
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
