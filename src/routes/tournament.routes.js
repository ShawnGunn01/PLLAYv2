const express = require('express');
const router = express.Router();
const tournamentService = require('../services/tournament.service');
const wagerService = require('../services/wager.service');
const validate = require('../middleware/validate.middleware');
const { requireAuth, requireGameSecretKey } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/async.middleware');
const { tournamentSubscribeSchema, validateScoreSchema } = require('../validation/schemas/tournament.schema');
const { NotFoundError } = require('../utils/errors');

router.post('/subscribe', 
  requireAuth,
  validate(tournamentSubscribeSchema),
  asyncHandler(async (req, res) => {
    const { tournamentId } = req.body;

    // Check if already subscribed
    const existingSubscription = tournamentService.getSubscriptionStatus(tournamentId);
    if (existingSubscription) {
      return res.json({
        success: true,
        message: 'Already subscribed to tournament results',
        subscriptionId: existingSubscription.subscriptionId
      });
    }

    // Generate webhook URL for this tournament
    const webhookUrl = `${req.protocol}://${req.get('host')}/tournament/webhook/${tournamentId}`;
    
    const subscription = await tournamentService.subscribeToResults(tournamentId, webhookUrl);

    res.json({
      success: true,
      message: 'Successfully subscribed to tournament results',
      subscriptionId: subscription.subscriptionId,
      webhookUrl
    });
  })
);

router.post('/webhook/:tournamentId',
  requireGameSecretKey,
  asyncHandler(async (req, res) => {
    const { tournamentId } = req.params;
    const eventData = req.body;

    // Validate tournament ID
    if (!tournamentId || tournamentId !== eventData.payload?.tournamentId) {
      throw new NotFoundError('Invalid tournament ID');
    }

    // Process tournament results
    const results = await tournamentService.processResults(eventData);

    // Distribute winnings
    await wagerService.distributeWinnings(tournamentId, results.winners);

    // Clean up subscription
    await tournamentService.unsubscribe(tournamentId);

    res.json({
      success: true,
      message: 'Tournament results processed successfully',
      results
    });
  })
);

router.get('/:tournamentId/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { tournamentId } = req.params;
    const status = tournamentService.getSubscriptionStatus(tournamentId);

    if (!status) {
      throw new NotFoundError('Tournament subscription not found');
    }

    res.json({
      success: true,
      status: 'subscribed',
      details: status
    });
  })
);

module.exports = router;