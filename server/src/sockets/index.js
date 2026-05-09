import { eventBus } from '../services/eventBus.js';
import { otpService } from '../services/otpService.js';
import { readStore } from '../database/store.js';

export function setupSockets(io) {
  io.on('connection', async (socket) => {
    socket.emit('snapshot', await readStore());

    socket.on('otp:submit', async (otp, callback) => {
      try {
        const result = await otpService.submitOtp(otp);
        callback?.({ ok: true, result });
      } catch (error) {
        callback?.({ ok: false, error: error.message });
      }
    });
  });

  eventBus.on('status:update', (status) => io.emit('status:update', status));
  eventBus.on('log:new', (log) => io.emit('log:new', log));
  eventBus.on('logs:clear', () => io.emit('logs:clear'));
  eventBus.on('user:update', (user) => io.emit('user:update', user));
  otpService.on('otp:request', (payload) => io.emit('otp:request', payload));
  otpService.on('otp:received', (payload) => io.emit('otp:received', payload));
}
