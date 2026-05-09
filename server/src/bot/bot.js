import TelegramBot from 'node-telegram-bot-api';
import { env } from '../config/env.js';
import { addLog } from '../services/logService.js';
import { getChats, getStatus, registerChat } from '../services/stateService.js';
import { monitorService } from '../services/monitorService.js';
import { otpService } from '../services/otpService.js';
import { readStore } from '../database/store.js';
import { dashboardKeyboard, formatStatus, helpText } from './keyboards.js';

export const bot = new TelegramBot(env.botToken, { polling: true });

async function sendDashboard(chatId) {
  const status = await getStatus();
  return bot.sendMessage(chatId, formatStatus(status), { reply_markup: dashboardKeyboard() });
}

export function setupBot() {
  bot.on('message', async (msg) => {
    if (msg.chat?.id) await registerChat(msg.chat.id);
  });

  bot.onText(/\/start/, async (msg) => {
    await addLog('info', `مستخدم جديد فتح البوت: ${msg.chat.id}`);
    await bot.sendMessage(msg.chat.id, helpText(), { reply_markup: dashboardKeyboard() });
  });

  bot.onText(/\/dashboard/, (msg) => sendDashboard(msg.chat.id));
  bot.onText(/\/status|\/server/, (msg) => sendDashboard(msg.chat.id));
  bot.onText(/\/help/, (msg) => bot.sendMessage(msg.chat.id, helpText(), { reply_markup: dashboardKeyboard() }));

  bot.onText(/\/startcheck/, async (msg) => {
    await monitorService.start();
    await sendDashboard(msg.chat.id);
  });

  bot.onText(/\/stopcheck/, async (msg) => {
    await monitorService.stop();
    await sendDashboard(msg.chat.id);
  });

  bot.onText(/\/restart/, async (msg) => {
    await monitorService.restart();
    await sendDashboard(msg.chat.id);
  });

  bot.onText(/\/logs/, async (msg) => {
    const state = await readStore();
    const logs = state.logs.slice(0, 10).map((log) => `${log.level.toUpperCase()} — ${log.message}`).join('\n');
    await bot.sendMessage(msg.chat.id, logs || 'لا توجد سجلات بعد');
  });

  bot.onText(/\/otp(?:\s+(\d{4,8}))?/, async (msg, match) => {
    if (!match?.[1]) return bot.sendMessage(msg.chat.id, 'أرسل الرمز بهذا الشكل: /otp 123456');
    try {
      await otpService.submitOtp(match[1]);
      await bot.sendMessage(msg.chat.id, '✅ تم استلام رمز OTP');
    } catch (error) {
      await bot.sendMessage(msg.chat.id, `⚠️ ${error.message}`);
    }
  });

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    await registerChat(chatId);
    const action = query.data;
    try {
      if (action === 'startcheck') await monitorService.start();
      if (action === 'stopcheck') await monitorService.stop();
      if (action === 'status') await sendDashboard(chatId);
      if (action === 'logs') {
        const state = await readStore();
        const logs = state.logs.slice(0, 8).map((log) => `${log.level}: ${log.message}`).join('\n');
        await bot.sendMessage(chatId, logs || 'لا توجد سجلات بعد');
      }
      if (action === 'otp') await bot.sendMessage(chatId, 'أرسل الرمز عبر /otp 123456 أو من داخل Mini App');
      await bot.answerCallbackQuery(query.id);
    } catch (error) {
      await bot.answerCallbackQuery(query.id, { text: error.message, show_alert: true });
    }
  });

  otpService.on('otp:request', async () => {
    const chats = await getChats();
    await Promise.allSettled(
      chats.map((chatId) =>
        bot.sendMessage(chatId, '🔑 تم طلب رمز OTP. افتح لوحة التحكم أو أرسله عبر /otp 123456', {
          reply_markup: dashboardKeyboard()
        })
      )
    );
  });

  addLog('success', 'تم تشغيل بوت تيليجرام');
}

export async function stopBot() {
  await bot.stopPolling();
}
