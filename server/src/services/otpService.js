import { EventEmitter } from 'events';
import { setStatus } from './stateService.js';
import { addLog } from './logService.js';

class OtpService extends EventEmitter {
  constructor() {
    super();
    this.pending = null;
  }

  async requestOtp(context = {}) {
    if (this.pending) {
      this.pending.reject(new Error('تم استبدال طلب OTP بطلب أحدث'));
    }

    await setStatus({ otpRequested: true, registration: 'بانتظار إدخال رمز OTP' });
    await addLog('warning', 'تم طلب رمز OTP من المستخدم', context);

    this.emit('otp:request', {
      requestedAt: new Date().toISOString(),
      expiresIn: 180,
      context
    });

    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.pending = null;
        await setStatus({ otpRequested: false, registration: 'انتهت مهلة إدخال OTP' });
        reject(new Error('انتهت مهلة إدخال رمز OTP'));
      }, 180000);

      this.pending = {
        resolve: async (otp) => {
          clearTimeout(timer);
          this.pending = null;
          await setStatus({ otpRequested: false, registration: 'تم استلام OTP، جارٍ الإكمال' });
          resolve(otp);
        },
        reject
      };
    });
  }

  async submitOtp(otp) {
    const cleanOtp = String(otp || '').replace(/\D/g, '');
    if (!/^\d{4,8}$/.test(cleanOtp)) {
      throw new Error('رمز OTP غير صالح');
    }
    if (!this.pending) {
      throw new Error('لا يوجد طلب OTP نشط');
    }
    await addLog('success', 'تم استلام OTP من الواجهة');
    await this.pending.resolve(cleanOtp);
    this.emit('otp:received', { receivedAt: new Date().toISOString() });
    return { ok: true };
  }
}

export const otpService = new OtpService();
