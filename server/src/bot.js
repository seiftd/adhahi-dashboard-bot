const TelegramBot = require('node-telegram-bot-api');
const { config } = require('./config');
const { logger } = require('./utils/logger');

let bot;
const knownChats = new Set();

function getStatusText() {
  return [
    '📊 حالة سيرفر أضاحي الجزائر',
    '',
    '✅ السيرفر: يعمل',
    `🌍 البيئة: ${config.nodeEnv}`,
    `📍 الولاية: ${config.targetWilaya}`,
    `🎯 الرابط: ${config.targetUrl}`,
    `⏱️ مدة التشغيل: ${Math.floor(process.uptime())} ثانية`
  ].join('\n');
}

function startBot() {
  if (!config.botToken) {
    logger.warn('BOT_TOKEN is missing; Telegram bot will not start');
    return null;
  }

  if (bot) {
    return bot;
  }

  bot = new TelegramBot(config.botToken, {
    polling: {
      interval: 1000,
      autoStart: true,
      params: { timeout: 10 }
    }
  });

  bot.on('message', (message) => {
    if (message.chat && message.chat.id) {
      knownChats.add(message.chat.id);
    }
  });

  bot.onText(/\/start/, async (message) => {
    knownChats.add(message.chat.id);
    await bot.sendMessage(
      message.chat.id,
      'مرحبًا بك في بوت أضاحي الجزائر 🇩🇿\nاستخدم /status لمعرفة حالة السيرفر.'
    );
  });

  bot.onText(/\/status/, async (message) => {
    knownChats.add(message.chat.id);
    await bot.sendMessage(message.chat.id, getStatusText());
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
  if (!bot) return;

  if (config.startupChatId) {
    knownChats.add(config.startupChatId);
  }

  if (knownChats.size === 0) return;

  await Promise.allSettled(
    Array.from(knownChats).map((chatId) =>
      bot.sendMessage(chatId, `🚀 تم تشغيل السيرفر بنجاح\n\n${getStatusText()}`)
    )
  );
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
