const express = require('express');
const router = express.Router();
const pllay = require('../services/pllay-plugin.service');
const { requireActiveGame } = require('../middleware/pllay-plugin.middleware');

router.post('/start', async (req, res) => {
  try {
    if (pllay.isGameActive()) {
      return res.status(400).json({
        success: false,
        error: 'Game already in progress'
      });
    }

    const gameSession = await pllay.startGame();
    
    res.json({
      success: true,
      session: gameSession
    });
  } catch (error) {
    console.error('Game start error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/end', requireActiveGame, async (req, res) => {
  try {
    const { score, encryptionKey } = req.body;

    if (score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Score is required'
      });
    }

    const result = await pllay.endGame(score, encryptionKey);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Game end error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    const currentGame = pllay.getCurrentGame();
    
    res.json({
      success: true,
      active: pllay.isGameActive(),
      currentGame
    });
  } catch (error) {
    console.error('Game status error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;