const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics.service');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { analyticsSchema } = require('../validation/schemas/analytics.schema');
const asyncHandler = require('../middleware/async.middleware');

// Track user activity
router.post('/track',
  requireAuth,
  validate(analyticsSchema.activity),
  asyncHandler(async (req, res) => {
    const activity = await analyticsService.trackUserActivity(
      req.user.id,
      req.body
    );
    res.json({
      success: true,
      activity
    });
  })
);

// Get tournament analytics
router.get('/tournament/:tournamentId',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const analytics = await analyticsService.getTournamentAnalytics(
      req.params.tournamentId
    );
    res.json({
      success: true,
      analytics
    });
  })
);

// Get payment analytics
router.get('/payments',
  requireAuth,
  requireAdmin,
  validate(analyticsSchema.dateRange),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const analytics = await analyticsService.getPaymentAnalytics(
      startDate,
      endDate
    );
    res.json({
      success: true,
      analytics
    });
  })
);

// Get performance metrics
router.get('/performance',
  requireAuth,
  requireAdmin,
  validate(analyticsSchema.performance),
  asyncHandler(async (req, res) => {
    const { timeframe } = req.query;
    const metrics = await analyticsService.getPerformanceMetrics(timeframe);
    res.json({
      success: true,
      metrics
    });
  })
);

module.exports = router;