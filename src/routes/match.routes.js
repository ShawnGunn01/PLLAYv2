const express = require('express');
const router = express.Router();
const matchService = require('../services/match.service');
const gameService = require('../services/game.service');

router.post('/template', async (req, res) => {
  try {
    const {
      name,
      type,
      maxSets,
      matchEndCondition,
      playersInSet,
      minPlayersInSet,
      matchPoints,
      tournamentPoints,
      waitTimeForPlayer,
      matchPointsAggregate
    } = req.body;

    if (!name || !playersInSet || !matchEndCondition) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    const template = await matchService.createMatchTemplate({
      name,
      type,
      maxSets,
      matchEndCondition,
      playersInSet,
      minPlayersInSet,
      matchPoints,
      tournamentPoints,
      waitTimeForPlayer,
      matchPointsAggregate
    });

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Match template creation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:matchId/set/start', async (req, res) => {
  try {
    const { matchId } = req.params;
    const set = await matchService.startSet(matchId);

    res.json({
      success: true,
      set
    });
  } catch (error) {
    console.error('Set start error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/set/:setId/score', async (req, res) => {
  try {
    const { setId } = req.params;
    const { scores } = req.body;

    if (!scores || !Array.isArray(scores)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scores format'
      });
    }

    const result = await matchService.submitSetScore(setId, scores);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:matchId/status', async (req, res) => {
  try {
    const { matchId } = req.params;
    const status = await matchService.getMatchStatus(matchId);

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Match status error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:matchId/winner', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { templateId } = req.query;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Match template ID required'
      });
    }

    const [matchStatus, matchTemplate] = await Promise.all([
      matchService.getMatchStatus(matchId),
      matchService.getMatchTemplate(templateId)
    ]);

    const winner = matchService.calculateMatchWinner(matchStatus, matchTemplate);

    res.json({
      success: true,
      winner
    });
  } catch (error) {
    console.error('Match winner calculation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;