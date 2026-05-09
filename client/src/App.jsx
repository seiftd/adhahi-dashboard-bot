import './styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { UserInfo } from './pages/UserInfo';
import { Control } from './pages/Control';
import { Logs } from './pages/Logs';
import { OtpModal } from './components/OtpModal';
import { Toast } from './components/Toast';
import { useTelegram } from './hooks/useTelegram';
import { useRealtime } from './hooks/useRealtime';

export default function App() {
  useTelegram();
  useRealtime();

  return (
    <>
      <AppLayout
        pages={{
          dashboard: <Dashboard />,
          user: <UserInfo />,
          control: <Control />,
          logs: <Logs />
        }}
      />
      <OtpModal />
      <Toast />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
