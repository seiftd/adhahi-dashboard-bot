import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 20000
});

export const apiService = {
  snapshot: () => api.get('/snapshot').then((res) => res.data),
  status: () => api.get('/status').then((res) => res.data),
  saveUser: (payload) => api.post('/user', payload).then((res) => res.data),
  start: () => api.post('/monitor/start').then((res) => res.data),
  stop: () => api.post('/monitor/stop').then((res) => res.data),
  restart: () => api.post('/monitor/restart').then((res) => res.data),
  submitOtp: (otp) => api.post('/otp', { otp }).then((res) => res.data),
  clearLogs: () => api.delete('/logs').then((res) => res.data)
};
