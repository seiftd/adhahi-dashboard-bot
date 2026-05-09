import { useEffect } from 'react';

export function useTelegram() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;
    webApp.ready();
    webApp.expand();
    webApp.setHeaderColor('#020617');
    webApp.setBackgroundColor('#020617');
  }, []);
}
