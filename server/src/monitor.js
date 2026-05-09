const { config } = require('./config');
const { createPage } = require('./browser');
const { logger } = require('./utils/logger');

const UNAVAILABLE_TEXT = '\u062d\u062c\u0632 \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631 \u062d\u0627\u0644\u064a\u0627';
const SEARCH_PLACEHOLDERS = {
  wilaya: '\u0648\u0644\u0627\u064a\u0629',
  theWilaya: '\u0627\u0644\u0648\u0644\u0627\u064a\u0629',
  search: '\u0628\u062d\u062b'
};

let isMonitoring = false;
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

async function safeGoto(page, url) {
  for (let i = 0; i < 3; i += 1) {
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      return true;
    } catch (error) {
      console.log('Retry...', i);
      logger.warn('Retrying page load', {
        attempt: i + 1,
        error: error.message
      });
    }
  }

  return false;
}

async function findAndFillSearch(page) {
  await page.fill('input', config.targetWilaya).then(() => true).catch(() => false);

  const selectors = [
    'input[type="search"]',
    `input[placeholder*="${SEARCH_PLACEHOLDERS.wilaya}"]`,
    `input[placeholder*="${SEARCH_PLACEHOLDERS.theWilaya}"]`,
    `input[placeholder*="${SEARCH_PLACEHOLDERS.search}"]`,
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
  let context;

  try {
    logger.info('Checking availability', {
      targetUrl: config.targetUrl,
      targetWilaya: config.targetWilaya
    });

    const { context: browserContext, page } = await createPage();
    context = browserContext;

    const ok = await safeGoto(page, process.env.TARGET_URL || config.targetUrl);
    if (!ok) {
      lastError = 'Failed to load page';
      return false;
    }

    await page.waitForSelector('body', { state: 'visible', timeout: 15000 });
    await findAndFillSearch(page);
    await page.waitForTimeout(2000);

    const text = await page.content();

    if (text.includes(UNAVAILABLE_TEXT)) {
      available = false;
    } else {
      available = true;
    }

    lastScreenshot = await page.screenshot({
      fullPage: true,
      type: 'png'
    });
    lastScreenshotAt = new Date().toISOString();

    logger.info('Availability check finished', {
      available,
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
      caption: '\ud83d\udcf8 \u0644\u0642\u0637\u0629 \u0634\u0627\u0634\u0629 \u0645\u0646 \u0635\u0641\u062d\u0629 \u0623\u0636\u0627\u062d\u064a'
    }).catch((error) => {
      logger.error('Failed to send Telegram screenshot', { error: error.message });
    });
  }
}

function startAlertSpam() {
  if (alertInterval) return;

  alertInterval = setInterval(async () => {
    await sendAvailabilityAlert('\ud83d\udea8\ud83d\udea8 \u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633 \u0645\u062a\u0648\u0641\u0631\u0629 \u0627\u0644\u0622\u0646 !!!');
  }, 3000);
}

async function monitorTick() {
  if (!isMonitoring) return;

  if (isChecking) return;

  isChecking = true;
  lastCheck = new Date().toISOString();
  lastError = null;

  const isAvailable = await checkAvailability();
  isChecking = false;

  if (!isAvailable) return;

  await sendAvailabilityAlert('\ud83d\udea8 \u0645\u062a\u0648\u0641\u0631 !!!');
  startAlertSpam();
}

async function startMonitoringLoop() {
  while (isMonitoring) {
    if (!isChecking) {
      isChecking = true;
      lastCheck = new Date().toISOString();
      lastError = null;

      try {
        const isAvailable = await checkAvailability();
        if (isAvailable) {
          await sendAvailabilityAlert('\ud83d\udea8 \u0645\u062a\u0648\u0641\u0631 !!!');
          startAlertSpam();
        }
      } catch (error) {
        lastError = error.message;
        logger.error('Monitoring loop failed', { error: error.message });
      }

      isChecking = false;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

function startMonitoring(chatId) {
  if (chatId) setUserChatId(chatId);
  if (isMonitoring) return getStatus();

  isMonitoring = true;
  available = false;
  lastError = null;
  logger.success('Monitoring started');

  startMonitoringLoop();

  return getStatus();
}

function stopMonitoring() {
  isMonitoring = false;

  if (alertInterval) clearInterval(alertInterval);

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
  checkAvailability,
  startMonitoringLoop,
  safeGoto
};
