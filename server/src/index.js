require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { startMonitoring } = require('./monitor');

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
