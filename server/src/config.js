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
  targetWilaya: process.env.TARGET_WILAYA || '\u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633',
  headless: true,
  logLevel: process.env.LOG_LEVEL || 'info'
};

module.exports = { config };
