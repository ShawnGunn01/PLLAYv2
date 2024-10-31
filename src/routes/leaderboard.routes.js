const express = require('express');
const router = express.Router();
const leaderboardService = require('../services/leaderboard.service');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { leaderboardSchema } = require('../validation/schemas/leaderboard.schema');
const asyncHandler = require('../middleware/async.middleware');

// Get global leaderboard
router.get('/global',
  validate(leaderboardSchema.options),
  asyncHandler(async (req, res) => {
    const leaderboard = await leaderboardService.getGlobalLeaderboard(req.query);
    res.json({
      success: true,
      leaderboard
    });
  })
);

// Get game leaderboard
router.get('/game/:gameId',
  validate(leaderboardSchema.options),
  asyncHandler(async (req, res) => {
    const leaderboard = await leaderboardService.getGameLeaderboard(
      req.params.gameId,
      req.query
    );
    res.json({
      success: true,
      leaderboard
    });
  })
);

// Get tournament leaderboard
router.get('/tournament/:tournamentId',
  asyncHandler(async (req, res) => {
    const leaderboard = await leaderboardService.getTournamentLeaderboard(
      req.params.tournamentId
    );
    res.json({
      success: true,
      leaderboard
    });
  })
);

// Get user rank
router.get('/rank/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { gameId } = req.query;
    const rank = await leaderboardService.getUserRank(req.params.userId, gameId);
    res.json({
      success: true,
      rank
    });
  })
);

module.exports = router;