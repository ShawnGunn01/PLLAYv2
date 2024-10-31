const express = require('express');
const fetch = require('node-fetch');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Import WebSocket manager
const webSocketManager = require('./websocket/WebSocketManager');

// Initialize WebSocket
webSocketManager.initialize(server);

// Import monitoring middleware
const {
  metricsMiddleware,
  responseTimeMiddleware,
  statusMonitorMiddleware
} = require('./middleware/monitoring.middleware');

// Import logger and logging middleware
const logger = require('./utils/logger');
const { httpLogger, requestLogger, auditLogger } = require('./middleware/logging.middleware');

// Import routes
const healthRoutes = require('./routes/health.routes');
const oauthRoutes = require('./routes/oauth.routes');
const wagerRoutes = require('./routes/wager.routes');
const tournamentRoutes = require('./routes/tournament.routes');
const gameRoutes = require('./routes/game.routes');
const tournamentStructureRoutes = require('./routes/tournament-structure.routes');
const matchRoutes = require('./routes/match.routes');
const gameModeRoutes = require('./routes/game-mode.routes');
const scoreRoutes = require('./routes/score.routes');
const gameSessionRoutes = require('./routes/game-session.routes');

// Import middleware
const { initializePLLAY } = require('./middleware/pllay-plugin.middleware');
const errorHandler = require('./middleware/error.middleware');
const { NotFoundError } = require('./utils/errors');

// Apply monitoring middleware
app.use(statusMonitorMiddleware);
app.use(metricsMiddleware);
app.use(responseTimeMiddleware);

// Apply logging middleware
app.use(httpLogger);
app.use(requestLogger);
app.use(auditLogger);

// Initialize PLLAY plugin
app.use(initializePLLAY);

// Health check routes
app.use('/health', healthRoutes);

// API routes
app.use('/oauth', oauthRoutes);
app.use('/wager', wagerRoutes);
app.use('/tournament', tournamentRoutes);
app.use('/games', gameRoutes);
app.use('/tournament-structure', tournamentStructureRoutes);
app.use('/match', matchRoutes);
app.use('/game-modes', gameModeRoutes);
app.use('/scores', scoreRoutes);
app.use('/game-session', gameSessionRoutes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

// Global error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`PLLAY service running on port ${PORT}`);
  logger.info('Service monitoring:');
  logger.info(`- Health check: http://localhost:${PORT}/health`);
  logger.info(`- Metrics: http://localhost:${PORT}/metrics`);
  logger.info(`- Status: http://localhost:${PORT}/status`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing server...');
  webSocketManager.close();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});