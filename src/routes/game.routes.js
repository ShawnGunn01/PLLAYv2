const express = require('express');
const router = express.Router();
const gameService = require('../services/game.service');
const validate = require('../middleware/validate.middleware');
const { requireAuth, requireGameSecretKey } = require('../middleware/auth.middleware');
const { cacheMiddleware, clearCache } = require('../middleware/cache.middleware');
const asyncHandler = require('../middleware/async.middleware');
const { createGameModeSchema } = require('../validation/schemas/game.schema');
const { NotFoundError } = require('../utils/errors');

// Cache configuration
const CACHE_TTL = 3600; // 1 hour
const listCacheKey = 'games:list';
const gameDetailsCacheKey = (gameId) => `games:${gameId}`;

router.get('/list',
  cacheMiddleware({
    ttl: CACHE_TTL,
    keyGenerator: () => listCacheKey
  }),
  asyncHandler(async (req, res) => {
    const { offset, limit } = req.query;
    const result = await gameService.getGames(
      parseInt(offset) || 0,
      parseInt(limit) || 20
    );

    res.json({
      success: true,
      ...result
    });
  })
);

router.get('/:gameId/score-types',
  cacheMiddleware({
    ttl: CACHE_TTL,
    keyGenerator: (req) => gameDetailsCacheKey(req.params.gameId)
  }),
  asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    
    if (!gameId) {
      throw new NotFoundError('Missing game ID');
    }

    const result = await gameService.getGameScoreTypes(gameId);
    res.json({
      success: true,
      ...result
    });
  })
);

router.get('/:gameId/modes',
  cacheMiddleware({
    ttl: CACHE_TTL,
    keyGenerator: (req) => `games:${req.params.gameId}:modes`
  }),
  asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    
    if (!gameId) {
      throw new NotFoundError('Missing game ID');
    }

    const result = await gameService.getGameModes(gameId);
    res.json({
      success: true,
      ...result
    });
  })
);

router.post('/:gameId/modes/validate',
  requireGameSecretKey,
  validate(createGameModeSchema),
  clearCache((req) => `games:${req.params.gameId}:modes`),
  asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const { gameModeId, playersCount } = req.body;

    if (!gameId || !gameModeId || !playersCount) {
      throw new NotFoundError('Missing required parameters');
    }

    const { gameModes } = await gameService.getGameModes(gameId);
    const gameMode = gameModes.find(mode => mode.id === gameModeId);

    if (!gameMode) {
      throw new NotFoundError('Invalid game mode');
    }

    gameService.validateGameMode(gameMode, playersCount);

    res.json({
      success: true,
      valid: true,
      gameMode
    });
  })
);

module.exports = router;