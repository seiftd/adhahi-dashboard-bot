import dotenv from 'dotenv';

dotenv.config();

export const env = {
  botToken: process.env.BOT_TOKEN,
  botUsername: process.env.BOT_USERNAME || 'AdhasDz_bot',
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  checkInterval: Number(process.env.CHECK_INTERVAL || 5000),
  headless: String(process.env.HEADLESS || 'true') === 'true',
  targetUrl: process.env.TARGET_URL || 'https://adhahi.dz/register',
  targetWilaya: process.env.TARGET_WILAYA || 'سوق أهراس',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  publicAppUrl: process.env.PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`,
  logLevel: process.env.LOG_LEVEL || 'info'
};

if (!env.botToken) {
  throw new Error('BOT_TOKEN is required');
}
