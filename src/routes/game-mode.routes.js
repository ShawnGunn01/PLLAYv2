const express = require('express');
const router = express.Router();
const gameModeService = require('../services/game-mode.service');
const validate = require('../middleware/validate.middleware');
const { requireAuth, requireGameSecretKey } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/async.middleware');
const { createGameModeSchema } = require('../validation/schemas/game.schema');
const { NotFoundError } = require('../utils/errors');

router.post('/',
  requireGameSecretKey,
  validate(createGameModeSchema),
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      type,
      maxSetDuration,
      minParticipants,
      maxParticipants,
      penaltyPoints,
      setParameters,
      isPublic
    } = req.body;

    const gameMode = await gameModeService.createGameMode({
      name,
      description,
      type,
      maxSetDuration,
      minParticipants,
      maxParticipants,
      penaltyPoints,
      setParameters,
      isPublic
    });

    res.json({
      success: true,
      gameMode
    });
  })
);

router.patch('/:gameModeId',
  requireGameSecretKey,
  asyncHandler(async (req, res) => {
    const { gameModeId } = req.params;
    const updates = req.body;

    const gameMode = await gameModeService.updateGameMode(gameModeId, updates);

    if (!gameMode) {
      throw new NotFoundError('Game mode not found');
    }

    res.json({
      success: true,
      gameMode
    });
  })
);

router.post('/:gameModeId/validate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { gameModeId } = req.params;
    const { playersCount } = req.body;

    if (!playersCount) {
      throw new ValidationError('Players count is required');
    }

    await gameModeService.validateGameMode(gameModeId, playersCount);

    res.json({
      success: true,
      message: 'Game mode configuration is valid'
    });
  })
);

module.exports = router;