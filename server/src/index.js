const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const { chromium } = require('playwright');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_URL = process.env.TARGET_URL || 'https://adhahi.dz/register';
const TARGET_WILAYA = process.env.TARGET_WILAYA || '\u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633';
const CHECK_INTERVAL = Number(process.env.CHECK_INTERVAL || 5000);
const UNAVAILABLE_TEXT = '\u062d\u062c\u0632 \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631 \u062d\u0627\u0644\u064a\u0627';

let isMonitoring = false;
let currentAvailable = false;
let isChecking = false;
let lastCheckTime = null;
let lastError = null;
let lastScreenshot = null;
let alertInterval = null;
let userChatId = null;
let bot = null;

function log(message, meta) {
  const suffix = meta ? ` ${JSON.stringify(meta)}` : '';
  console.log(`[${new Date().toISOString()}] ${message}${suffix}`);
}

app.use(cors({
  origin: 'https://adhahi-dashboard-bot.vercel.app'
}));
app.use(express.json());

app.use((req, res, next) => {
  log('API request', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin || 'none'
  });
  next();
});

async function createBrowser() {
  return chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
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
      lastError = error.message;
    }
  }
  return false;
}

async function sendTelegramAlert(message) {
  if (!bot || !userChatId) return;

  await bot.sendMessage(userChatId, message).catch((error) => {
    lastError = error.message;
    log('Telegram message failed', { error: error.message });
  });

  if (lastScreenshot) {
    await bot.sendPhoto(userChatId, lastScreenshot, {
      caption: '\ud83d\udcf8 \u0644\u0642\u0637\u0629 \u0634\u0627\u0634\u0629 \u0645\u0646 \u0635\u0641\u062d\u0629 \u0623\u0636\u0627\u062d\u064a'
    }).catch((error) => {
      lastError = error.message;
      log('Telegram screenshot failed', { error: error.message });
    });
  }
}

function startAlertSpam() {
  if (alertInterval) return;
  alertInterval = setInterval(() => {
    sendTelegramAlert('\ud83d\udea8\ud83d\udea8 \u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633 \u0645\u062a\u0648\u0641\u0631\u0629 \u0627\u0644\u0622\u0646 !!!');
  }, 3000);
}

function stopAlertSpam() {
  if (alertInterval) clearInterval(alertInterval);
  alertInterval = null;
}

async function checkAvailability() {
  const browser = await createBrowser();
  const page = await browser.newPage();

  try {
    const ok = await safeGoto(page, TARGET_URL);

    if (!ok) {
      lastError = 'Failed to load page';
      await browser.close();
      return;
    }

    await page.waitForTimeout(3000);
    await page.fill('input', TARGET_WILAYA).catch(async () => {
      await page.locator('input').first().fill(TARGET_WILAYA);
    });
    await page.waitForTimeout(2000);

    const html = await page.content();

    if (html.includes(UNAVAILABLE_TEXT)) {
      currentAvailable = false;
      stopAlertSpam();
    } else {
      currentAvailable = true;
    }

    lastScreenshot = await page.screenshot({
      fullPage: true,
      type: 'png'
    });

    if (currentAvailable) {
      await sendTelegramAlert('\ud83d\udea8 \u0645\u062a\u0648\u0641\u0631 !!!');
      startAlertSpam();
    }
  } catch (error) {
    lastError = error.message;
    currentAvailable = false;
    log('Availability check failed', { error: error.message });
  }

  await browser.close().catch((error) => {
    lastError = error.message;
  });
}

async function startMonitoringLoop() {
  while (isMonitoring) {
    isChecking = true;
    lastCheckTime = new Date();

    try {
      await checkAvailability();
    } catch (error) {
      lastError = error.message;
      log('Monitoring loop error', { error: error.message });
    }

    isChecking = false;
    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL));
  }
}

function getStatus() {
  return {
    monitoring: isMonitoring,
    available: currentAvailable,
    checking: isChecking,
    lastCheck: lastCheckTime,
    lastError
  };
}

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/start', async (req, res) => {
  if (!isMonitoring) {
    isMonitoring = true;
    startMonitoringLoop();
  }
  res.json({ success: true, monitoring: true });
});

app.post('/api/stop', (req, res) => {
  isMonitoring = false;
  stopAlertSpam();
  res.json({ success: true, monitoring: false });
});

app.get('/api/status', (req, res) => {
  res.json(getStatus());
});

app.get('/api/screenshot', (req, res) => {
  if (!lastScreenshot) {
    res.status(404).json({ status: 'not_found', message: 'No screenshot captured yet' });
    return;
  }
  res.type('png').send(lastScreenshot);
});

app.use((req, res) => {
  res.status(404).json({ status: 'not_found', path: req.path });
});

function startTelegramBot() {
  if (!process.env.BOT_TOKEN) {
    log('BOT_TOKEN missing; Telegram bot disabled');
    return;
  }

  bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

  bot.onText(/\/start/, (msg) => {
    userChatId = msg.chat.id;
    bot.sendMessage(userChatId, '\u2705 \u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629.\n\u0627\u0633\u062a\u062e\u062f\u0645 /monitor \u0644\u0628\u062f\u0621 \u0645\u0631\u0627\u0642\u0628\u0629 \u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633.');
  });

  bot.onText(/\/monitor/, (msg) => {
    userChatId = msg.chat.id;
    if (!isMonitoring) {
      isMonitoring = true;
      startMonitoringLoop();
    }
    bot.sendMessage(userChatId, '\ud83d\udce1 \u0628\u062f\u0623\u062a \u0645\u0631\u0627\u0642\u0628\u0629 \u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633.');
  });

  bot.onText(/\/stop/, (msg) => {
    userChatId = msg.chat.id;
    isMonitoring = false;
    stopAlertSpam();
    bot.sendMessage(userChatId, '\u23f9 \u062a\u0645 \u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629.');
  });

  bot.onText(/\/status/, (msg) => {
    userChatId = msg.chat.id;
    bot.sendMessage(userChatId, JSON.stringify(getStatus(), null, 2));
  });

  bot.on('polling_error', (error) => {
    lastError = error.message;
    log('Telegram polling error', { error: error.message });
  });

  log('Telegram bot started');
}

const server = app.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
  log('Monitoring config', { TARGET_URL, TARGET_WILAYA, CHECK_INTERVAL });
  startTelegramBot();
});

async function shutdown(signal) {
  log(`Received ${signal}; shutting down`);
  isMonitoring = false;
  stopAlertSpam();

  if (bot) {
    await bot.stopPolling().catch((error) => {
      lastError = error.message;
    });
  }

  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  lastError = reason && reason.message ? reason.message : String(reason);
  log('Unhandled rejection', { error: lastError });
});
process.on('uncaughtException', (error) => {
  lastError = error.message;
  log('Uncaught exception', { error: error.message });
});
