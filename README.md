# adhahi-dashboard-bot

منظومة عربية متكاملة تضم Telegram Bot + Telegram Mini App + Web Dashboard + Playwright automation لمراقبة صفحة التسجيل في أضاحي الجزائر لولاية **سوق أهراس**.

## المميزات

- واجهة عربية RTL كاملة بتصميم Dark SaaS وGlassmorphism.
- لوحة تحكم realtime عبر Socket.IO.
- بوت تيليجرام بأوامر وأزرار Inline عربية.
- مراقبة تلقائية كل 5 ثوانٍ مع Playwright وإعادة استخدام المتصفح.
- تعبئة بيانات المستخدم وطلب OTP من Telegram Mini App.
- سجلات مباشرة، فلترة، بحث، وحفظ محلي بسيط داخل JSON.
- Docker وPM2 جاهزان للنشر.

## المتطلبات

- Node.js 20+
- npm
- Chromium dependencies، أو استخدم Docker image المرفق.

## التثبيت المحلي

```bash
npm install
npm run build
npm start
```

للتطوير:

```bash
npm run dev
```

- API والنسخة المبنية تعمل على: `http://localhost:3000`
- Vite dev server يعمل على: `http://localhost:5173`

## متغيرات البيئة

الملف `.env` مُنشأ وجاهز. أهم القيم:

```env
BOT_TOKEN=...
BOT_USERNAME=AdhasDz_bot
PORT=3000
CHECK_INTERVAL=5000
HEADLESS=true
TARGET_URL=https://adhahi.dz/register
TARGET_WILAYA=سوق أهراس
PUBLIC_APP_URL=http://localhost:3000
```

> Telegram Mini Apps تحتاج رابط HTTPS عام. على VPS استخدم Nginx + SSL وضع `PUBLIC_APP_URL=https://your-domain.com`.

## أوامر البوت

- `/start` بدء البوت
- `/dashboard` فتح لوحة التحكم
- `/status` عرض الحالة
- `/server` حالة السيرفر
- `/startcheck` بدء المراقبة
- `/stopcheck` إيقاف المراقبة
- `/restart` إعادة تشغيل المراقبة
- `/otp 123456` إرسال رمز OTP
- `/logs` آخر السجلات
- `/help` المساعدة

## PM2

```bash
npm install
npm run build
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Docker

```bash
docker compose up -d --build
docker compose logs -f
```

## نشر Ubuntu VPS

```bash
sudo apt update
sudo apt install -y git curl nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
git clone <repo-url> adhahi-dashboard-bot
cd adhahi-dashboard-bot
npm install
npm run build
npm install -g pm2
pm2 start ecosystem.config.js
```

إعداد Nginx مختصر:

```nginx
server {
  server_name your-domain.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
}
```

ثم فعّل SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Playwright

محليًا:

```bash
npx playwright install chromium
```

في Docker يتم استخدام image رسمي يحتوي المتطلبات.

## Troubleshooting

- إذا لم تفتح Mini App داخل Telegram: تأكد أن `PUBLIC_APP_URL` رابط HTTPS عام.
- إذا فشل Playwright: جرّب `HEADLESS=false` محليًا وشاهد السلوك.
- إذا لم تصل رسائل البوت: تأكد من صحة `BOT_TOKEN` وأن البوت بدأ بمحادثة `/start`.
- الصور عند الأخطاء تُحفظ داخل `screenshots/`.
- السجلات تُحفظ داخل `logs/combined.log` و`logs/error.log`.

## تنبيه تشغيلي

بنية صفحة `adhahi.dz/register` قد تتغير. تم بناء محددات Playwright لتكون مرنة مع النصوص العربية/الفرنسية/الإنجليزية، لكن قد تحتاج ضبط selectors عند تغير تصميم الموقع.
