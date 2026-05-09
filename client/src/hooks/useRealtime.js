import { useEffect } from 'react';
import { apiService } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export function useRealtime() {
  const { setSnapshot, setStatus, notify } = useAppStore();

  useEffect(() => {
    let active = true;

    async function loadSnapshot() {
      try {
        const snapshot = await apiService.snapshot();
        if (active) setSnapshot(snapshot);
      } catch (error) {
        if (active) notify({ type: 'error', message: 'تعذر الاتصال بسيرفر Railway' });
      }
    }

    async function refreshStatus() {
      try {
        const status = await apiService.status();
        if (active) setStatus(status);
      } catch {
        if (active) {
          setStatus({
            server: 'offline',
            playwright: 'idle',
            bot: 'offline',
            monitoring: false,
            registration: 'تعذر الاتصال بسيرفر Railway',
            lastCheck: new Date().toISOString(),
            checkSpeed: 0,
            attempts: 0,
            currentWilaya: 'سوق أهراس',
            otpRequested: false
          });
        }
      }
    }

    loadSnapshot();
    const timer = window.setInterval(refreshStatus, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [setSnapshot, setStatus, notify]);
}
