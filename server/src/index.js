const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { logger } = require('./utils/logger');
const { startBot, stopBot, notifyServerStarted } = require('./bot');
const { closeBrowser } = require('./browser');
const monitor = require('./monitor');

const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  'https://adhahi-dashboard-bot.vercel.app'
];

const app = express();

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  logger.info('API request', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin || 'none'
  });
  next();
});

app.get('/', (req, res) => {
  res.json({
    status: 'ok'
  });
});

app.get('/api/status', (req, res) => {
  res.json(monitor.getStatus());
});

app.post('/api/start', (req, res) => {
  res.json(monitor.startMonitoring());
});

app.post('/api/stop', (req, res) => {
  res.json(monitor.stopMonitoring());
});

app.get('/api/screenshot', (req, res) => {
  const screenshot = monitor.getLastScreenshot();
  if (!screenshot) {
    res.status(404).json({ status: 'not_found', message: 'No screenshot captured yet' });
    return;
  }

  res.type('png').send(screenshot);
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
  logger.warn('Route not found', {
    method: req.method,
    path: req.path
  });
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

const server = app.listen(PORT, async () => {
  logger.success(`Server started on port ${PORT}`);
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
    monitor.stopMonitoring();
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
