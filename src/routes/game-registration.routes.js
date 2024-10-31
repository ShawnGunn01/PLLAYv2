const express = require('express');
const router = express.Router();
const gameRegistrationService = require('../services/game-registration.service');

router.post('/register', async (req, res) => {
  try {
    const { name, description, type, logo } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name and description are required'
      });
    }

    const game = await gameRegistrationService.registerGame({
      name,
      description,
      type,
      logo
    });

    res.json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Game registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/score', async (req, res) => {
  try {
    const { name, description, identifier, sorting } = req.body;

    if (!name || !description || !identifier) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and identifier are required'
      });
    }

    const score = await gameRegistrationService.createGameScore({
      name,
      description,
      identifier,
      sorting
    });

    res.json({
      success: true,
      score
    });
  } catch (error) {
    console.error('Score creation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/referral', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Referral name is required'
      });
    }

    const referral = await gameRegistrationService.createReferral(name);

    res.json({
      success: true,
      referral
    });
  } catch (error) {
    console.error('Referral creation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/view', async (req, res) => {
  try {
    const { name, referralId, integrationType, customization } = req.body;

    if (!name || !referralId || !integrationType) {
      return res.status(400).json({
        success: false,
        error: 'Name, referral ID, and integration type are required'
      });
    }

    const view = await gameRegistrationService.createGameView({
      name,
      referralId,
      integrationType,
      customization
    });

    res.json({
      success: true,
      view,
      credentials: {
        publicKey: view.publicKey,
        playerBaseUrl: view.playerBaseUrl
      }
    });
  } catch (error) {
    console.error('View creation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/details', async (req, res) => {
  try {
    const details = await gameRegistrationService.getGameDetails();

    res.json({
      success: true,
      details
    });
  } catch (error) {
    console.error('Get game details error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;