const { chromium } = require('playwright');

const TARGET_WILAYA = '\u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633';
const UNAVAILABLE_TEXT = '\u062d\u062c\u0632 \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631 \u062d\u0627\u0644\u064a\u0627';

async function createBrowser() {
  return chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });
}

async function checkAvailability(status) {
  const browser = await createBrowser();
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    await page.goto(process.env.TARGET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    await page.waitForTimeout(4000);

    await page.fill('input', TARGET_WILAYA);
    await page.waitForTimeout(2000);

    const html = await page.content();

    if (html.includes(UNAVAILABLE_TEXT)) {
      status.available = false;
    } else {
      status.available = true;
      console.log('🚨 AVAILABLE 🚨');
    }
  } catch (error) {
    status.lastError = error.message;
  }

  await browser.close();
}

async function startMonitoring(status, isRunning) {
  while (isRunning()) {
    status.checking = true;
    status.lastCheck = new Date();
    status.lastError = null;

    await checkAvailability(status);

    status.checking = false;

    await new Promise((resolve) => setTimeout(resolve, process.env.CHECK_INTERVAL || 5000));
  }
}

module.exports = { startMonitoring };
