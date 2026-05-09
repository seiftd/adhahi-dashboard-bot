const { config } = require('./config');
const { createPage } = require('./browser');
const { logger } = require('./utils/logger');

let isMonitoring = false;
let monitorTimer = null;
let alertInterval = null;
let userChatId = null;
let lastCheck = null;
let available = false;
let isChecking = false;
let lastError = null;
let lastScreenshot = null;
let lastScreenshotAt = null;
let telegram = {
  sendMessage: async () => {},
  sendPhoto: async () => {}
};

function setTelegramSender(sender) {
  telegram = {
    sendMessage: sender.sendMessage || telegram.sendMessage,
    sendPhoto: sender.sendPhoto || telegram.sendPhoto
  };
}

function setUserChatId(chatId) {
  userChatId = chatId;
  logger.info('Telegram chat saved for alerts', { chatId });
}

function getStatus() {
  return {
    monitoring: isMonitoring,
    lastCheck,
    available,
    checking: isChecking,
    targetWilaya: config.targetWilaya,
    lastError,
    hasScreenshot: Boolean(lastScreenshot),
    lastScreenshotAt
  };
}

async function findAndFillSearch(page) {
  const selectors = [
    'input[type="search"]',
    'input[placeholder*="ولاية"]',
    'input[placeholder*="الولاية"]',
    'input[placeholder*="بحث"]',
    'input[name*="wilaya" i]',
    'input[name*="search" i]',
    'input[type="text"]',
    '[contenteditable="true"]'
  ];

  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) && (await locator.isVisible().catch(() => false))) {
      await locator.click({ timeout: 5000 });
      await locator.fill('').catch(() => {});
      await locator.type(config.targetWilaya, { delay: 80 }).catch(async () => {
        await locator.fill(config.targetWilaya);
      });
      await page.keyboard.press('Enter').catch(() => {});
      return true;
    }
  }

  await page.locator('body').click().catch(() => {});
  await page.keyboard.type(config.targetWilaya, { delay: 80 }).catch(() => {});
  await page.keyboard.press('Enter').catch(() => {});
  return false;
}

async function checkAvailability() {
  if (isChecking) return available;

  isChecking = true;
  lastCheck = new Date().toISOString();
  lastError = null;

  let context;

  try {
    logger.info('Checking availability', {
      targetUrl: config.targetUrl,
      targetWilaya: config.targetWilaya
    });

    const { context: browserContext, page } = await createPage();
    context = browserContext;

    await page.goto(config.targetUrl, {
      waitUntil: 'networkidle',
      timeout: 45000
    });

    await page.waitForSelector('body', { state: 'visible', timeout: 15000 });
    await findAndFillSearch(page);
    await page.waitForTimeout(2500);

    const pageText = await page.locator('body').innerText({ timeout: 10000 }).catch(() => '');
    const unavailableTextExists = pageText.includes('حجز غير متوفر حاليا');
    available = !unavailableTextExists;

    lastScreenshot = await page.screenshot({
      fullPage: true,
      type: 'png'
    });
    lastScreenshotAt = new Date().toISOString();

    logger.info('Availability check finished', {
      available,
      unavailableTextExists,
      lastCheck
    });

    return available;
  } catch (error) {
    lastError = error.message;
    available = false;
    logger.error('Availability check failed', { error: error.message });
    return false;
  } finally {
    isChecking = false;
    if (context) await context.close().catch(() => {});
  }
}

async function sendAvailabilityAlert(message) {
  if (!userChatId) {
    logger.warn('Availability detected but no Telegram chat is registered');
    return;
  }

  await telegram.sendMessage(userChatId, message).catch((error) => {
    logger.error('Failed to send Telegram alert', { error: error.message });
  });

  if (lastScreenshot) {
    await telegram.sendPhoto(userChatId, lastScreenshot, {
      caption: '📸 لقطة شاشة من صفحة أضاحي'
    }).catch((error) => {
      logger.error('Failed to send Telegram screenshot', { error: error.message });
    });
  }
}

function startAlertSpam() {
  if (alertInterval) return;

  alertInterval = setInterval(async () => {
    await sendAvailabilityAlert('🚨🚨 سوق أهراس متوفرة الآن !!!');
  }, 3000);
}

async function monitorTick() {
  if (!isMonitoring) return;

  const isAvailable = await checkAvailability();
  if (!isAvailable) return;

  await sendAvailabilityAlert('🚨 متوفر !!!');
  startAlertSpam();
}

function startMonitoring(chatId) {
  if (chatId) setUserChatId(chatId);
  if (isMonitoring) return getStatus();

  isMonitoring = true;
  available = false;
  lastError = null;
  logger.success('Monitoring started');

  monitorTick();
  monitorTimer = setInterval(monitorTick, config.checkInterval || 5000);

  return getStatus();
}

function stopMonitoring() {
  isMonitoring = false;

  if (monitorTimer) clearInterval(monitorTimer);
  if (alertInterval) clearInterval(alertInterval);

  monitorTimer = null;
  alertInterval = null;

  logger.warn('Monitoring stopped');
  return getStatus();
}

function getLastScreenshot() {
  return lastScreenshot;
}

module.exports = {
  setTelegramSender,
  setUserChatId,
  startMonitoring,
  stopMonitoring,
  getStatus,
  getLastScreenshot,
  checkAvailability
};
