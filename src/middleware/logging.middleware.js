const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom morgan token for response time
morgan.token('response-time', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;
  
  return ms.toFixed(3);
});

// Custom morgan format
const morganFormat = ':method :url :status :response-time ms - :res[content-length]';

// Create morgan middleware
const httpLogger = morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startHrTime = process.hrtime();

  // Log request body if present
  if (Object.keys(req.body).length > 0) {
    logger.info('Request Body', {
      method: req.method,
      url: req.url,
      body: req.body
    });
  }

  // Log response
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    
    logger.request(req, res, elapsedTimeInMs);
  });

  next();
};

// Audit logging middleware
const auditLogger = (req, res, next) => {
  const userId = req.user?.id || 'anonymous';
  
  // Log sensitive operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    logger.audit(userId, `${req.method} ${req.path}`, {
      body: req.body,
      params: req.params,
      query: req.query
    });
  }

  next();
};

module.exports = {
  httpLogger,
  requestLogger,
  auditLogger
};