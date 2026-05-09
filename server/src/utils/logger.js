import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { env } from '../config/env.js';

const logsDir = path.resolve('logs');
fs.mkdirSync(logsDir, { recursive: true });

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${stack || message}${extra}`;
  })
);

export const logger = winston.createLogger({
  level: env.logLevel,
  format,
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), format) }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' })
  ]
});
