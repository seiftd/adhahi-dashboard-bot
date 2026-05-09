const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { startMonitoring } = require('./monitor');

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = valueParts.join('=');
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

let isMonitoring = false;
const status = {
  available: false,
  checking: false,
  lastCheck: null,
  lastError: null
};

function start() {
  if (!isMonitoring) {
    isMonitoring = true;
    startMonitoring(status, () => isMonitoring);
  }

  return { monitoring: true };
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Adhahi local monitor is running' });
});

app.post('/api/start', (req, res) => {
  res.json(start());
});

app.get('/api/start', (req, res) => {
  res.json(start());
});

app.post('/api/stop', (req, res) => {
  isMonitoring = false;
  res.json({ monitoring: false });
});

app.get('/api/status', (req, res) => {
  res.json({ monitoring: isMonitoring, ...status });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
