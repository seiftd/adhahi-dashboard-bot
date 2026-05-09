import { env } from '../config/env.js';
import { AsyncQueue } from '../utils/asyncQueue.js';
import { addLog } from './logService.js';
import { getStatus, setStatus } from './stateService.js';
import { registrationService } from './registrationService.js';

class MonitorService {
  constructor() {
    this.timer = null;
    this.queue = new AsyncQueue();
  }

  async start() {
    if (this.timer) return this.current();
    await setStatus({ monitoring: true, registration: 'بدأت المراقبة', attempts: (await getStatus()).attempts || 0 });
    await addLog('success', 'تم بدء المراقبة التلقائية');
    this.timer = setInterval(() => this.tick(), env.checkInterval);
    await this.tick();
    return this.current();
  }

  async stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    await setStatus({ monitoring: false, registration: 'تم إيقاف المراقبة' });
    await addLog('warning', 'تم إيقاف المراقبة');
    return this.current();
  }

  async restart() {
    await this.stop();
    return this.start();
  }

  async tick() {
    return this.queue.push(async () => {
      const status = await getStatus();
      await setStatus({ attempts: Number(status.attempts || 0) + 1 });
      const result = await registrationService.checkOnce();
      if (result.available) await this.stop();
      return result;
    });
  }

  async current() {
    return getStatus();
  }
}

export const monitorService = new MonitorService();
