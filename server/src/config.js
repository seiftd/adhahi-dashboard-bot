const dotenv = require('dotenv');

dotenv.config();

const config = {
  botToken: process.env.BOT_TOKEN || '',
  botUsername: process.env.BOT_USERNAME || '',
  startupChatId: process.env.STARTUP_CHAT_ID || process.env.ADMIN_CHAT_ID || '',
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'production',
  checkInterval: Number(process.env.CHECK_INTERVAL || 5000),
  clientUrl: process.env.CLIENT_URL || '',
  targetUrl: process.env.TARGET_URL || 'https://adhahi.dz/register',
  targetWilaya: process.env.TARGET_WILAYA || 'سوق أهراس',
  headless: String(process.env.HEADLESS || 'true').toLowerCase() !== 'false',
  logLevel: process.env.LOG_LEVEL || 'info'
};

module.exports = { config };
