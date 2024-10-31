const express = require('express');
const router = express.Router();
const payoutService = require('../services/payout.service');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { payoutSchema } = require('../validation/schemas/payout.schema');
const asyncHandler = require('../middleware/async.middleware');

// Request payout
router.post('/request',
  requireAuth,
  validate(payoutSchema.request),
  asyncHandler(async (req, res) => {
    const payout = await payoutService.requestPayout(req.user.id, req.body);
    res.json({
      success: true,
      payout
    });
  })
);

// Process payout (admin only)
router.post('/:payoutId/process',
  requireAuth,
  requireAdmin,
  validate(payoutSchema.process),
  asyncHandler(async (req, res) => {
    const payout = await payoutService.processPayout(
      req.params.payoutId,
      req.body
    );
    res.json({
      success: true,
      payout
    });
  })
);

// Get payout history
router.get('/history',
  requireAuth,
  validate(payoutSchema.history),
  asyncHandler(async (req, res) => {
    const history = await payoutService.getPayoutHistory(
      req.user.id,
      req.query
    );
    res.json({
      success: true,
      history
    });
  })
);

// Get payout stats
router.get('/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const stats = await payoutService.getPayoutStats(req.user.id);
    res.json({
      success: true,
      stats
    });
  })
);

module.exports = router;