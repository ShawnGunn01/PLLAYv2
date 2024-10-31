const express = require('express');
const router = express.Router();
const tournamentSeriesService = require('../services/tournament-series.service');

router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      gameMode,
      maxSetDuration,
      penaltyPoints,
      startTime,
      duration,
      frequency,
      stageMode
    } = req.body;

    // Validate required fields
    if (!name || !gameMode || !maxSetDuration || !startTime || !duration || !frequency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Validate configuration
    tournamentSeriesService.validateTournamentSeriesConfig({
      startTime,
      duration,
      frequency,
      maxSetDuration
    });

    const series = await tournamentSeriesService.createTournamentSeries({
      name,
      description,
      gameMode,
      maxSetDuration,
      penaltyPoints,
      startTime,
      duration,
      frequency,
      stageMode
    });

    res.json({
      success: true,
      series
    });
  } catch (error) {
    console.error('Tournament series creation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.patch('/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const updates = req.body;

    const series = await tournamentSeriesService.updateTournamentSeries(seriesId, updates);

    res.json({
      success: true,
      series
    });
  } catch (error) {
    console.error('Tournament series update error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:seriesId/pause', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const series = await tournamentSeriesService.pauseTournamentSeries(seriesId);

    res.json({
      success: true,
      series
    });
  } catch (error) {
    console.error('Tournament series pause error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:seriesId/resume', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const series = await tournamentSeriesService.resumeTournamentSeries(seriesId);

    res.json({
      success: true,
      series
    });
  } catch (error) {
    console.error('Tournament series resume error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const series = await tournamentSeriesService.getTournamentSeriesList();

    res.json({
      success: true,
      series
    });
  } catch (error) {
    console.error('Get tournament series list error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;