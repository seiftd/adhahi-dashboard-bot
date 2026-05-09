const express = require('express');
const monitor = require('../monitor');

const router = express.Router();

router.post('/start', (req, res) => {
  const status = monitor.startMonitoring();
  res.json({
    success: true,
    monitoring: true,
    ...status
  });
});

router.post('/stop', (req, res) => {
  const status = monitor.stopMonitoring();
  res.json({
    success: true,
    monitoring: false,
    ...status
  });
});

router.get('/status', (req, res) => {
  const status = monitor.getStatus();
  res.json({
    monitoring: status.monitoring,
    available: status.available,
    lastCheck: status.lastCheck,
    checking: status.checking,
    lastError: status.lastError,
    targetWilaya: status.targetWilaya,
    hasScreenshot: status.hasScreenshot,
    lastScreenshotAt: status.lastScreenshotAt
  });
});

router.get('/screenshot', (req, res) => {
  const screenshot = monitor.getLastScreenshot();
  if (!screenshot) {
    res.status(404).json({ status: 'not_found', message: 'No screenshot captured yet' });
    return;
  }

  res.type('png').send(screenshot);
});

module.exports = router;
