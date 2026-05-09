import { randomUUID } from 'crypto';
import { updateStore } from '../database/store.js';
import { eventBus } from './eventBus.js';
import { logger } from '../utils/logger.js';

const maxLogs = 600;

export async function addLog(level, message, meta = {}) {
  const entry = {
    id: randomUUID(),
    level,
    message,
    meta,
    createdAt: new Date().toISOString()
  };

  logger[level === 'success' ? 'info' : level === 'warning' ? 'warn' : level](message, meta);

  await updateStore((state) => ({
    ...state,
    logs: [entry, ...state.logs].slice(0, maxLogs)
  }));

  eventBus.emit('log:new', entry);
  return entry;
}

export async function clearLogs() {
  await updateStore((state) => ({ ...state, logs: [] }));
  eventBus.emit('logs:clear');
}
