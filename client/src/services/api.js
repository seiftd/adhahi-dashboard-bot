export const API = import.meta.env.VITE_API_URL;

if (!API) {
  throw new Error('VITE_API_URL is required');
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export const monitoringApi = {
  getStatus: () => request('/api/status'),
  start: () => request('/api/start', { method: 'POST' }),
  stop: () => request('/api/stop', { method: 'POST' }),
  screenshotUrl: () => `${API}/api/screenshot`
};
