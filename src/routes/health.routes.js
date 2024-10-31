const express = require('express');
const router = express.Router();
const os = require('os');

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      arch: process.arch,
      platform: process.platform,
      version: process.version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpu: {
        cores: os.cpus().length,
        loadAvg: os.loadavg()
      }
    },
    process: {
      pid: process.pid,
      memory: process.memoryUsage(),
      versions: process.versions
    }
  };

  res.json(healthInfo);
});

// Readiness probe
router.get('/ready', (req, res) => {
  // Add your readiness checks here
  const isReady = true; // Replace with actual readiness check

  if (isReady) {
    res.json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  // Add your liveness checks here
  const isLive = true; // Replace with actual liveness check

  if (isLive) {
    res.json({ status: 'alive' });
  } else {
    res.status(500).json({ status: 'not alive' });
  }
});

module.exports = router;