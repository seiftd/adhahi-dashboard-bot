console.log('before env');
const { env } = await import('./server/src/config/env.js');
console.log('before express');
await import('express');
console.log('before bot');
await import('./server/src/bot/bot.js');
console.log('after bot import');
