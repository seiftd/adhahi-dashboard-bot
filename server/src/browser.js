const { chromium } = require('playwright');
const { config } = require('./config');
const { logger } = require('./utils/logger');

let browser;

async function getBrowser() {
  if (browser && browser.isConnected()) {
    return browser;
  }

  logger.info('Starting Playwright Chromium', { headless: config.headless });
  browser = await chromium.launch({
    headless: config.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  browser.on('disconnected', () => {
    logger.warn('Playwright browser disconnected');
    browser = null;
  });

  return browser;
}

async function createPage() {
  const activeBrowser = await getBrowser();
  const context = await activeBrowser.newContext({
    locale: 'ar-DZ',
    timezoneId: 'Africa/Algiers',
    viewport: { width: 1366, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);
  page.setDefaultNavigationTimeout(35000);
  return { context, page };
}

async function closeBrowser() {
  if (!browser) return;
  await browser.close().catch((error) => logger.error('Failed to close browser', { error: error.message }));
  browser = null;
}

module.exports = {
  getBrowser,
  createPage,
  closeBrowser
};
