import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiService } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { Button } from './Button';

export function OtpModal() {
  const open = useAppStore((state) => state.otpModal || state.status.otpRequested);
  const hideOtp = useAppStore((state) => state.hideOtp);
  const notify = useAppStore((state) => state.notify);
  const [otp, setOtp] = useState('');
  const [seconds, setSeconds] = useState(180);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSeconds(180);
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [open]);

  async function submit() {
    setLoading(true);
    try {
      await apiService.submitOtp(otp);
      notify({ type: 'success', message: 'تم إرسال الرمز بنجاح' });
      hideOtp();
      setOtp('');
    } catch (error) {
      notify({ type: 'error', message: error.message || 'تعذر إرسال الرمز' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ scale: 0.9, y: 25 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 25 }} className="glass neon-border w-full max-w-md rounded-[2rem] p-6 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-cyan-400/15 text-3xl shadow-glow">🔑</div>
            <h2 className="text-2xl font-black text-white">أدخل رمز OTP</h2>
            <p className="mt-2 text-sm text-slate-400">تم طلب الرمز من موقع التسجيل. الوقت المتبقي: {seconds} ثانية</p>
            <input
              dir="ltr"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))}
              className="mt-6 w-full rounded-3xl border border-cyan-300/20 bg-slate-950/80 px-5 py-4 text-center text-3xl font-black tracking-[0.5em] text-cyan-200 outline-none focus:border-cyan-300"
              placeholder="••••••"
            />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button disabled={loading || otp.length < 4} onClick={submit}>
                {loading ? 'جارٍ الإرسال...' : 'تأكيد الرمز'}
              </Button>
              <Button variant="ghost" onClick={hideOtp}>إغلاق</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
