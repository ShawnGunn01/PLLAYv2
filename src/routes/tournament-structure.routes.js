const express = require('express');
const router = express.Router();
const tournamentStructureService = require('../services/tournament-structure.service');

router.post('/series', async (req, res) => {
  try {
    const {
      gameId,
      name,
      description,
      gameMode,
      scoreType,
      stages
    } = req.body;

    if (!gameId || !gameMode || !scoreType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Validate stage settings if provided
    if (stages) {
      stages.forEach(stage => {
        tournamentStructureService.validateStageSettings(stage.mode, stage.settings);
      });
    }

    const series = await tournamentStructureService.createTournamentSeries({
      gameId,
      name,
      description,
      gameMode,
      scoreType,
      stages
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

router.patch('/series/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const updates = req.body;

    const updatedSeries = await tournamentStructureService.updateTournamentSeries(
      seriesId,
      updates
    );

    res.json({
      success: true,
      series: updatedSeries
    });
  } catch (error) {
    console.error('Tournament series update error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/series/:seriesId/pause', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const pausedSeries = await tournamentStructureService.pauseTournamentSeries(seriesId);

    res.json({
      success: true,
      series: pausedSeries
    });
  } catch (error) {
    console.error('Tournament series pause error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/series/:seriesId/replace', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const newSeriesConfig = req.body;

    if (!newSeriesConfig.gameMode || !newSeriesConfig.scoreType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters for new series'
      });
    }

    const newSeries = await tournamentStructureService.replaceTournamentSeries(
      seriesId,
      newSeriesConfig
    );

    res.json({
      success: true,
      series: newSeries
    });
  } catch (error) {
    console.error('Tournament series replacement error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/tournament/:tournamentId/stages', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const stages = await tournamentStructureService.getTournamentStages(tournamentId);

    res.json({
      success: true,
      stages
    });
  } catch (error) {
    console.error('Get tournament stages error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/stage/:stageId/rounds', async (req, res) => {
  try {
    const { stageId } = req.params;
    const rounds = await tournamentStructureService.getStageRounds(stageId);

    res.json({
      success: true,
      rounds
    });
  } catch (error) {
    console.error('Get stage rounds error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;