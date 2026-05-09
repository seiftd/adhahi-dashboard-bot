const TelegramBot = require('node-telegram-bot-api');
const { config } = require('./config');
const { logger } = require('./utils/logger');
const monitor = require('./monitor');

let bot;

function getStatusText() {
  const status = monitor.getStatus();
  return [
    '📊 حالة مراقبة أضاحي الجزائر',
    '',
    '✅ السيرفر: يعمل',
    `📍 الولاية: ${config.targetWilaya}`,
    `📡 المراقبة: ${status.monitoring ? 'تعمل' : 'متوقفة'}`,
    `🔎 الفحص: ${status.checking ? 'جاري' : 'خامل'}`,
    `📦 التوفر: ${status.available ? 'متوفر' : 'غير متوفر'}`,
    `🕒 آخر فحص: ${status.lastCheck || 'لا يوجد'}`
  ].join('\n');
}

function startBot() {
  if (!config.botToken) {
    logger.warn('BOT_TOKEN is missing; Telegram bot will not start');
    return null;
  }

  if (bot) return bot;

  bot = new TelegramBot(config.botToken, {
    polling: {
      interval: 1000,
      autoStart: true,
      params: { timeout: 10 }
    }
  });

  monitor.setTelegramSender({
    sendMessage: (chatId, text, options) => bot.sendMessage(chatId, text, options),
    sendPhoto: (chatId, photo, options) => bot.sendPhoto(chatId, photo, options)
  });

  bot.on('message', (message) => {
    if (message.chat && message.chat.id) {
      monitor.setUserChatId(message.chat.id);
    }
  });

  bot.onText(/\/start/, async (message) => {
    monitor.setUserChatId(message.chat.id);
    await bot.sendMessage(
      message.chat.id,
      'مرحبًا بك في بوت مراقبة أضاحي الجزائر 🇩🇿\n\nاستخدم /monitor لبدء مراقبة سوق أهراس.\nاستخدم /stop لإيقاف المراقبة.\nاستخدم /status لمعرفة الحالة.'
    );
  });

  bot.onText(/\/status/, async (message) => {
    monitor.setUserChatId(message.chat.id);
    await bot.sendMessage(message.chat.id, getStatusText());
  });

  bot.onText(/\/monitor/, async (message) => {
    monitor.startMonitoring(message.chat.id);
    await bot.sendMessage(message.chat.id, '✅ تم بدء مراقبة سوق أهراس كل 5 ثوانٍ.');
  });

  bot.onText(/\/stop/, async (message) => {
    monitor.stopMonitoring();
    await bot.sendMessage(message.chat.id, '⏹ تم إيقاف المراقبة والتنبيهات.');
  });

  bot.on('polling_error', (error) => {
    logger.error('Telegram polling error', {
      code: error.code,
      message: error.message
    });
  });

  logger.success('Telegram bot started');
  return bot;
}

async function notifyServerStarted() {
  if (!bot || !config.startupChatId) return;

  monitor.setUserChatId(config.startupChatId);
  await bot.sendMessage(config.startupChatId, `🚀 تم تشغيل السيرفر بنجاح\n\n${getStatusText()}`).catch((error) => {
    logger.error('Failed to send startup Telegram message', { error: error.message });
  });
}

async function stopBot() {
  if (!bot) return;
  await bot.stopPolling().catch((error) => {
    logger.error('Failed to stop Telegram polling', { error: error.message });
  });
  bot = null;
}

module.exports = {
  startBot,
  stopBot,
  notifyServerStarted,
  getStatusText
};
