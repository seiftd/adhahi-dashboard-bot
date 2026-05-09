function timestamp() {
  return new Date().toISOString();
}

function write(level, message, meta) {
  const suffix = meta ? ` ${JSON.stringify(meta)}` : '';
  console.log(`[${timestamp()}] [${level.toUpperCase()}] ${message}${suffix}`);
}

const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
  success: (message, meta) => write('success', message, meta)
};

module.exports = { logger };
