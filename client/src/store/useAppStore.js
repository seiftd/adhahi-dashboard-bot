import { create } from 'zustand';

const initialStatus = {
  server: 'offline',
  playwright: 'idle',
  bot: 'offline',
  monitoring: false,
  registration: 'تحميل الحالة...',
  lastCheck: null,
  checkSpeed: 0,
  attempts: 0,
  currentWilaya: 'سوق أهراس',
  otpRequested: false
};

export const useAppStore = create((set) => ({
  status: initialStatus,
  user: {
    fullName: '',
    phone: '',
    nationalId: '',
    wilaya: 'سوق أهراس',
    commune: '',
    extraInfo: ''
  },
  logs: [],
  otpModal: false,
  toast: null,
  setSnapshot: (snapshot) => set({ status: snapshot.status, user: snapshot.user, logs: snapshot.logs }),
  setStatus: (status) => set({ status }),
  setUser: (user) => set({ user }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 600) })),
  clearLogs: () => set({ logs: [] }),
  showOtp: () => set({ otpModal: true }),
  hideOtp: () => set({ otpModal: false }),
  notify: (toast) => {
    set({ toast });
    setTimeout(() => set({ toast: null }), 3200);
  }
}));
