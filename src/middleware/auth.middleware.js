const { AuthenticationError, AuthorizationError } = require('../utils/errors');

const requireAuth = (req, res, next) => {
  const { authToken } = req.headers;

  if (!authToken) {
    return next(new AuthenticationError('Authentication token is required'));
  }

  try {
    // Verify token and attach user to request
    // This is where you'd implement your token verification logic
    next();
  } catch (error) {
    next(new AuthenticationError('Invalid authentication token'));
  }
};

const requireGameSecretKey = (req, res, next) => {
  const { 'pllay-game-secret-key': secretKey } = req.headers;

  if (!secretKey || secretKey !== process.env.GAME_SECRET_KEY) {
    return next(new AuthorizationError('Invalid game secret key'));
  }

  next();
};

module.exports = {
  requireAuth,
  requireGameSecretKey
};