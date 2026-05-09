import { env } from '../config/env.js';

export function dashboardKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '📋 فتح لوحة التحكم', web_app: { url: env.publicAppUrl } }],
      [
        { text: '▶ بدء', callback_data: 'startcheck' },
        { text: '⏹ إيقاف', callback_data: 'stopcheck' }
      ],
      [
        { text: '📊 الحالة', callback_data: 'status' },
        { text: '🔑 OTP', callback_data: 'otp' },
        { text: '📜 السجلات', callback_data: 'logs' }
      ]
    ]
  };
}

export function helpText() {
  return `أهلًا بك في بوت أضاحي الجزائر 🇩🇿

الأوامر المتاحة:
/dashboard فتح لوحة التحكم
/status عرض الحالة
/server حالة السيرفر
/startcheck بدء المراقبة
/stopcheck إيقاف المراقبة
/restart إعادة التشغيل
/otp إرسال رمز OTP
/logs آخر السجلات
/help المساعدة`;
}

export function formatStatus(status) {
  return `📋 لوحة التحكم

🟢 حالة السيرفر: ${status.server === 'online' ? 'يعمل' : status.server}
${status.monitoring ? '🟢' : '🟡'} حالة المراقبة: ${status.monitoring ? 'نشطة' : 'متوقفة'}
🎭 حالة Playwright: ${status.playwright}
🤖 حالة البوت: ${status.bot}
📍 الولاية الحالية: ${status.currentWilaya}
🕒 آخر فحص: ${status.lastCheck ? new Date(status.lastCheck).toLocaleString('ar-DZ') : 'لا يوجد'}
⚡ سرعة الفحص: ${status.checkSpeed || 0}ms
🔁 عدد المحاولات: ${status.attempts || 0}
📝 حالة التسجيل: ${status.registration}`;
}
