const pllay = require('../services/pllay-plugin.service');

async function initializePLLAY(req, res, next) {
  try {
    if (!pllay.isInitialized) {
      await pllay.initialize();
    }
    next();
  } catch (error) {
    console.error('PLLAY initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize PLLAY plugin'
    });
  }
}

function requireActiveGame(req, res, next) {
  if (!pllay.isGameActive()) {
    return res.status(400).json({
      success: false,
      error: 'No active game session'
    });
  }
  next();
}

module.exports = {
  initializePLLAY,
  requireActiveGame
};