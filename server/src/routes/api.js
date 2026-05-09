import express from 'express';
import { readStore } from '../database/store.js';
import { clearLogs } from '../services/logService.js';
import { getStatus, getUser, saveUser } from '../services/stateService.js';
import { monitorService } from '../services/monitorService.js';
import { otpService } from '../services/otpService.js';

export const apiRouter = express.Router();

apiRouter.get('/health', async (_req, res) => {
  res.json({ ok: true, status: await getStatus(), time: new Date().toISOString() });
});

apiRouter.get('/status', async (_req, res) => res.json(await getStatus()));
apiRouter.get('/snapshot', async (_req, res) => res.json(await readStore()));
apiRouter.get('/user', async (_req, res) => res.json(await getUser()));

apiRouter.post('/user', async (req, res, next) => {
  try {
    const required = ['fullName', 'phone', 'nationalId', 'wilaya', 'commune'];
    const missing = required.filter((field) => !String(req.body[field] || '').trim());
    if (missing.length) return res.status(422).json({ message: 'يرجى ملء جميع الحقول المطلوبة', missing });
    res.json(await saveUser(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/monitor/start', async (_req, res, next) => {
  try {
    res.json(await monitorService.start());
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/monitor/stop', async (_req, res, next) => {
  try {
    res.json(await monitorService.stop());
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/monitor/restart', async (_req, res, next) => {
  try {
    res.json(await monitorService.restart());
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/otp', async (req, res, next) => {
  try {
    res.json(await otpService.submitOtp(req.body.otp));
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/logs', async (_req, res) => {
  const store = await readStore();
  res.json(store.logs);
});

apiRouter.delete('/logs', async (_req, res) => {
  await clearLogs();
  res.json({ ok: true });
});
