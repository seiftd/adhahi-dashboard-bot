const TelegramBot = require('node-telegram-bot-api');
const { config } = require('./config');
const { logger } = require('./utils/logger');
const monitor = require('./monitor');

let bot;

function getStatusText() {
  const status = monitor.getStatus();
  return [
    '\ud83d\udcca \u062d\u0627\u0644\u0629 \u0645\u0631\u0627\u0642\u0628\u0629 \u0623\u0636\u0627\u062d\u064a \u0627\u0644\u062c\u0632\u0627\u0626\u0631',
    '',
    '\u2705 \u0627\u0644\u0633\u064a\u0631\u0641\u0631: \u064a\u0639\u0645\u0644',
    `\ud83d\udccd \u0627\u0644\u0648\u0644\u0627\u064a\u0629: ${config.targetWilaya}`,
    `\ud83d\udce1 \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629: ${status.monitoring ? '\u062a\u0639\u0645\u0644' : '\u0645\u062a\u0648\u0642\u0641\u0629'}`,
    `\ud83d\udd0e \u0627\u0644\u0641\u062d\u0635: ${status.checking ? '\u062c\u0627\u0631\u064a' : '\u062e\u0627\u0645\u0644'}`,
    `\ud83d\udce6 \u0627\u0644\u062a\u0648\u0641\u0631: ${status.available ? '\u0645\u062a\u0648\u0641\u0631' : '\u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631'}`,
    `\ud83d\udd52 \u0622\u062e\u0631 \u0641\u062d\u0635: ${status.lastCheck || '\u0644\u0627 \u064a\u0648\u062c\u062f'}`
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
      '\u0645\u0631\u062d\u0628\u064b\u0627 \u0628\u0643 \u0641\u064a \u0628\u0648\u062a \u0645\u0631\u0627\u0642\u0628\u0629 \u0623\u0636\u0627\u062d\u064a \u0627\u0644\u062c\u0632\u0627\u0626\u0631 \ud83c\udde9\ud83c\uddff\n\n\u0627\u0633\u062a\u062e\u062f\u0645 /monitor \u0644\u0628\u062f\u0621 \u0645\u0631\u0627\u0642\u0628\u0629 \u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633.\n\u0627\u0633\u062a\u062e\u062f\u0645 /stop \u0644\u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629.\n\u0627\u0633\u062a\u062e\u062f\u0645 /status \u0644\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u062d\u0627\u0644\u0629.'
    );
  });

  bot.onText(/\/status/, async (message) => {
    monitor.setUserChatId(message.chat.id);
    await bot.sendMessage(message.chat.id, getStatusText());
  });

  bot.onText(/\/monitor/, async (message) => {
    monitor.startMonitoring(message.chat.id);
    await bot.sendMessage(message.chat.id, '\u2705 \u062a\u0645 \u0628\u062f\u0621 \u0645\u0631\u0627\u0642\u0628\u0629 \u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633 \u0643\u0644 5 \u062b\u0648\u0627\u0646\u064d.');
  });

  bot.onText(/\/stop/, async (message) => {
    monitor.stopMonitoring();
    await bot.sendMessage(message.chat.id, '\u23f9 \u062a\u0645 \u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0648\u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a.');
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
  await bot.sendMessage(config.startupChatId, `\ud83d\ude80 \u062a\u0645 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0633\u064a\u0631\u0641\u0631 \u0628\u0646\u062c\u0627\u062d\n\n${getStatusText()}`).catch((error) => {
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
