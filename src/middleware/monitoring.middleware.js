const promBundle = require('express-prom-bundle');
const responseTime = require('response-time');
const statusMonitor = require('express-status-monitor');
const logger = require('../utils/logger');

// Configure Prometheus metrics
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { project: 'pllay-integration' },
  promClient: {
    collectDefaultMetrics: {
      timeout: 5000
    }
  }
});

// Response time monitoring
const responseTimeMiddleware = responseTime((req, res, time) => {
  logger.info('Response Time', {
    method: req.method,
    url: req.url,
    time: time,
    status: res.statusCode
  });
});

// Status monitoring configuration
const statusMonitorConfig = {
  title: 'PLLAY Service Status',
  theme: 'default.css',
  path: '/status',
  spans: [
    {
      interval: 1,
      retention: 60
    },
    {
      interval: 5,
      retention: 60
    },
    {
      interval: 15,
      retention: 60
    }
  ],
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    responseTime: true,
    rps: true,
    statusCodes: true
  },
  healthChecks: [
    {
      protocol: 'http',
      host: 'localhost',
      path: '/health',
      port: process.env.PORT || 3000
    }
  ]
};

const statusMonitorMiddleware = statusMonitor(statusMonitorConfig);

module.exports = {
  metricsMiddleware,
  responseTimeMiddleware,
  statusMonitorMiddleware
};