const client = require('prom-client');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code']
});

const gameSessionsTotal = new client.Counter({
  name: 'game_sessions_total',
  help: 'Total number of game sessions',
  labelNames: ['status']
});

const activeGameSessions = new client.Gauge({
  name: 'active_game_sessions',
  help: 'Number of currently active game sessions'
});

const scoreValidationDuration = new client.Histogram({
  name: 'score_validation_duration_seconds',
  help: 'Duration of score validation in seconds',
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestTotal);
register.registerMetric(gameSessionsTotal);
register.registerMetric(activeGameSessions);
register.registerMetric(scoreValidationDuration);

module.exports = {
  register,
  metrics: {
    httpRequestDurationMicroseconds,
    httpRequestTotal,
    gameSessionsTotal,
    activeGameSessions,
    scoreValidationDuration
  }
};