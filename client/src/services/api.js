export const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL is required');
}

const defaultStatus = {
  server: 'offline',
  playwright: 'idle',
  bot: 'online',
  monitoring: false,
  registration: 'بانتظار الاتصال بالسيرفر',
  lastCheck: null,
  checkSpeed: 0,
  attempts: 0,
  currentWilaya: 'سوق أهراس',
  otpRequested: false
};

async function request(path = '/') {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Backend request failed with status ${res.status}`);
  }

  return res.json();
}

function mapHealthToStatus(data) {
  return {
    ...defaultStatus,
    server: data.status === 'ok' ? 'online' : 'offline',
    registration: data.status === 'ok' ? 'السيرفر متصل وجاهز' : 'تعذر الاتصال بالسيرفر',
    lastCheck: new Date().toISOString(),
    checkSpeed: Math.round((data.uptime || 0) * 1000),
    currentWilaya: data.targetWilaya || defaultStatus.currentWilaya
  };
}

export const getStatus = async () => {
  const data = await request('/');
  return mapHealthToStatus(data);
};

export const apiService = {
  snapshot: async () => {
    const status = await getStatus();
    const savedUser = JSON.parse(localStorage.getItem('adhahi-user') || 'null');

    return {
      status,
      user: savedUser || {
        fullName: '',
        phone: '',
        nationalId: '',
        wilaya: 'سوق أهراس',
        commune: '',
        extraInfo: ''
      },
      logs: [
        {
          id: crypto.randomUUID(),
          level: 'success',
          message: 'تم الاتصال بسيرفر Railway بنجاح',
          createdAt: new Date().toISOString()
        }
      ]
    };
  },
  status: getStatus,
  saveUser: async (payload) => {
    localStorage.setItem('adhahi-user', JSON.stringify(payload));
    return payload;
  },
  start: getStatus,
  stop: getStatus,
  restart: getStatus,
  submitOtp: async () => ({ ok: true }),
  clearLogs: async () => ({ ok: true })
};
