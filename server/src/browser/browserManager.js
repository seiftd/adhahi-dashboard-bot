import { chromium } from 'playwright';
import { env } from '../config/env.js';
import { addLog } from '../services/logService.js';
import { setStatus } from '../services/stateService.js';

class BrowserManager {
  constructor() {
    this.browser = null;
    this.context = null;
  }

  async getContext() {
    if (this.context) return this.context;

    await setStatus({ playwright: 'starting' });
    this.browser = await chromium.launch({
      headless: env.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    this.context = await this.browser.newContext({
      locale: 'ar-DZ',
      timezoneId: 'Africa/Algiers',
      viewport: { width: 1366, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    });
    await setStatus({ playwright: 'ready' });
    await addLog('success', 'تم تشغيل متصفح Playwright');
    return this.context;
  }

  async newPage() {
    const context = await this.getContext();
    const page = await context.newPage();
    page.setDefaultTimeout(25000);
    page.setDefaultNavigationTimeout(35000);
    return page;
  }

  async close() {
    if (this.context) await this.context.close().catch(() => {});
    if (this.browser) await this.browser.close().catch(() => {});
    this.context = null;
    this.browser = null;
    await setStatus({ playwright: 'idle' });
  }
}

export const browserManager = new BrowserManager();
