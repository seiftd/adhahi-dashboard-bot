import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import { browserManager } from '../browser/browserManager.js';
import { getUser, setStatus } from './stateService.js';
import { addLog } from './logService.js';
import { otpService } from './otpService.js';

const delay = (min = 450, max = 1350) =>
  new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

async function clickFirstVisible(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) && (await locator.isVisible().catch(() => false))) {
      await locator.click();
      return true;
    }
  }
  return false;
}

async function fillFirstVisible(page, selectors, value) {
  if (!value) return false;
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) && (await locator.isVisible().catch(() => false))) {
      await locator.fill(value);
      await delay(120, 420);
      return true;
    }
  }
  return false;
}

async function selectWilaya(page, wilaya) {
  const select = page.locator('select').filter({ hasText: /سوق|Souk|wilaya|ولاية/i }).first();
  if ((await select.count()) && (await select.isVisible().catch(() => false))) {
    await select.selectOption({ label: wilaya }).catch(async () => {
      await select.selectOption({ label: 'Souk Ahras' });
    });
    return true;
  }

  await clickFirstVisible(page, [
    'text=اختر الولاية',
    'text=الولاية',
    '[role="combobox"]',
    '.select__control',
    '.ant-select-selector'
  ]);
  await delay();
  return clickFirstVisible(page, [`text="${wilaya}"`, 'text=/Souk\\s*Ahras/i', 'text=/سوق\\s*أهراس/i']);
}

async function detectAvailability(page) {
  const text = await page.locator('body').innerText({ timeout: 10000 }).catch(() => '');
  const unavailable = /(غير\s*متاح|مغلق|انتهت|لا\s*توجد|not\s*available|closed|complet)/i.test(text);
  const available = /(تسجيل|متاح|احجز|التالي|register|available|continue|suivant)/i.test(text);
  return { available: available && !unavailable, pageText: text.slice(0, 500) };
}

async function saveErrorScreenshot(page) {
  await fs.mkdir(path.resolve('screenshots'), { recursive: true });
  const file = path.resolve('screenshots', `error-${Date.now()}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  return file;
}

class RegistrationService {
  async checkOnce() {
    const startedAt = Date.now();
    const page = await browserManager.newPage();
    try {
      await setStatus({ playwright: 'checking', registration: 'جارٍ فحص موقع التسجيل' });
      await page.goto(env.targetUrl, { waitUntil: 'networkidle' });
      await delay();
      await page.waitForSelector('body', { state: 'visible' });
      await selectWilaya(page, env.targetWilaya);
      await delay();

      const result = await detectAvailability(page);
      await setStatus({
        lastCheck: new Date().toISOString(),
        checkSpeed: Date.now() - startedAt,
        registration: result.available ? 'التسجيل متاح، جارٍ البدء' : 'التسجيل غير متاح حاليًا'
      });

      if (result.available) {
        await addLog('success', `تم العثور على توفر التسجيل في ${env.targetWilaya}`);
        await this.register(page);
        return { available: true };
      }

      await addLog('info', `لا يوجد توفر حاليًا في ${env.targetWilaya}`);
      return { available: false };
    } catch (error) {
      const screenshot = await saveErrorScreenshot(page);
      await addLog('error', 'فشل فحص الموقع', { error: error.message, screenshot });
      await setStatus({ registration: 'حدث خطأ أثناء الفحص', playwright: 'ready' });
      return { available: false, error: error.message };
    } finally {
      await page.close().catch(() => {});
    }
  }

  async register(page) {
    const user = await getUser();
    await setStatus({ registration: 'جارٍ تعبئة معلومات المستخدم' });

    await clickFirstVisible(page, ['text=تسجيل', 'text=ابدأ', 'text=التالي', 'button:has-text("Register")']);
    await delay();

    await fillFirstVisible(page, ['input[name*="name" i]', 'input[placeholder*="الاسم"]', 'input[type="text"]'], user.fullName);
    await fillFirstVisible(page, ['input[name*="phone" i]', 'input[placeholder*="الهاتف"]', 'input[type="tel"]'], user.phone);
    await fillFirstVisible(page, ['input[name*="nin" i]', 'input[name*="id" i]', 'input[placeholder*="التعريف"]'], user.nationalId);
    await fillFirstVisible(page, ['input[name*="commune" i]', 'input[placeholder*="البلدية"]'], user.commune);

    await clickFirstVisible(page, ['text=إرسال', 'text=التالي', 'text=تأكيد', 'button[type="submit"]']);
    await delay(800, 1700);

    const otp = await otpService.requestOtp({ wilaya: env.targetWilaya, phone: user.phone });
    await fillFirstVisible(page, ['input[name*="otp" i]', 'input[placeholder*="OTP"]', 'input[placeholder*="الرمز"]'], otp);
    await clickFirstVisible(page, ['text=تأكيد', 'text=إكمال', 'text=إرسال', 'button[type="submit"]']);
    await page.waitForLoadState('networkidle').catch(() => {});

    const body = await page.locator('body').innerText().catch(() => '');
    if (/(نجاح|تم|success|confirmed|accept)/i.test(body)) {
      await setStatus({ registration: 'تم التسجيل بنجاح' });
      await addLog('success', 'اكتمل التسجيل بنجاح');
      return { ok: true };
    }

    await setStatus({ registration: 'تم إرسال البيانات، يرجى التحقق يدويًا' });
    await addLog('warning', 'لم يتم تأكيد النجاح نصيًا، تحقق من النتيجة يدويًا');
    return { ok: true, uncertain: true };
  }
}

export const registrationService = new RegistrationService();
