import path from 'path';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { apiRouter } from './routes/api.js';
import { setupSockets } from './sockets/index.js';
import { setupBot, stopBot } from './bot/bot.js';
import { browserManager } from './browser/browserManager.js';
import { setStatus } from './services/stateService.js';
import { addLog } from './services/logService.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'DELETE'] }
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

app.use('/api', apiRouter);

const clientDist = path.resolve('client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'), (error) => {
    if (error) res.status(200).send('Adhahi Dashboard Bot API is running. Build the client with npm run build.');
  });
});

app.use((error, _req, res, _next) => {
  logger.error(error.message, { stack: error.stack });
  res.status(error.status || 500).json({ message: error.message || 'خطأ داخلي في السيرفر' });
});

setupSockets(io);
setupBot();

server.listen(env.port, async () => {
  await setStatus({ server: 'online', bot: 'online' });
  await addLog('success', `السيرفر يعمل على المنفذ ${env.port}`);
  logger.info(`Server listening on ${env.port}`);
});

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down`);
  await addLog('warning', `إيقاف آمن بسبب ${signal}`).catch(() => {});
  await setStatus({ server: 'stopping', monitoring: false }).catch(() => {});
  await stopBot().catch(() => {});
  await browserManager.close().catch(() => {});
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', async (error) => {
  logger.error(error.message, { stack: error.stack });
  await addLog('error', 'خطأ غير متوقع', { error: error.message }).catch(() => {});
});
process.on('unhandledRejection', async (error) => {
  logger.error(error?.message || String(error));
  await addLog('error', 'وعد مرفوض غير معالج', { error: error?.message || String(error) }).catch(() => {});
});
