import { useEffect } from 'react';
import { socket } from '../services/socket';
import { useAppStore } from '../store/useAppStore';

export function useRealtime() {
  const { setSnapshot, setStatus, addLog, clearLogs, setUser, showOtp, hideOtp, notify } = useAppStore();

  useEffect(() => {
    socket.on('snapshot', setSnapshot);
    socket.on('status:update', setStatus);
    socket.on('log:new', addLog);
    socket.on('logs:clear', clearLogs);
    socket.on('user:update', setUser);
    socket.on('otp:request', () => {
      showOtp();
      notify({ type: 'warning', message: 'تم طلب رمز OTP الآن' });
    });
    socket.on('otp:received', () => {
      hideOtp();
      notify({ type: 'success', message: 'تم إرسال رمز OTP بنجاح' });
    });

    return () => {
      socket.off('snapshot', setSnapshot);
      socket.off('status:update', setStatus);
      socket.off('log:new', addLog);
      socket.off('logs:clear', clearLogs);
      socket.off('user:update', setUser);
      socket.off('otp:request');
      socket.off('otp:received');
    };
  }, [setSnapshot, setStatus, addLog, clearLogs, setUser, showOtp, hideOtp, notify]);
}
