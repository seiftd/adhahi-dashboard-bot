const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { logger } = require('./utils/logger');
const { startBot, stopBot, notifyServerStarted } = require('./bot');
const { closeBrowser } = require('./browser');

const app = express();

app.use(cors({ origin: config.clientUrl || true }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    environment: config.nodeEnv,
    targetWilaya: config.targetWilaya,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: 'not_found',
    path: req.path
  });
});

app.use((error, req, res, next) => {
  logger.error('Request failed', {
    error: error.message,
    path: req.path
  });
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

const server = app.listen(config.port, async () => {
  logger.success(`Server started on port ${config.port}`);
  logger.info('Railway runtime config loaded', {
    nodeEnv: config.nodeEnv,
    targetUrl: config.targetUrl,
    targetWilaya: config.targetWilaya,
    headless: config.headless
  });

  startBot();
  await notifyServerStarted();
});

server.on('error', (error) => {
  logger.error('Server listen error', {
    error: error.message,
    code: error.code
  });
});

async function shutdown(signal) {
  logger.warn(`Received ${signal}; shutting down gracefully`);

  server.close(async () => {
    await stopBot();
    await closeBrowser();
    logger.success('Shutdown complete');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason && reason.message ? reason.message : String(reason)
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
});
