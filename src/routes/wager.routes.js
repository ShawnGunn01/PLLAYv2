const express = require('express');
const router = express.Router();
const wagerService = require('../services/wager.service');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { wagerSchema } = require('../validation/schemas/wager.schema');
const asyncHandler = require('../middleware/async.middleware');

// Get wager stats
router.get('/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const stats = await wagerService.getWagerStats(req.user.id);
    res.json({
      success: true,
      stats
    });
  })
);

// Create new wager
router.post('/',
  requireAuth,
  validate(wagerSchema.create),
  asyncHandler(async (req, res) => {
    const wager = await wagerService.createWager(req.user.id, req.body);
    res.json({
      success: true,
      wager
    });
  })
);

// Complete wager
router.post('/:wagerId/complete',
  requireAuth,
  validate(wagerSchema.complete),
  asyncHandler(async (req, res) => {
    const wager = await wagerService.completeWager(
      req.params.wagerId,
      req.body
    );
    res.json({
      success: true,
      wager
    });
  })
);

// Get wager history
router.get('/history',
  requireAuth,
  validate(wagerSchema.history),
  asyncHandler(async (req, res) => {
    const history = await wagerService.getWagerHistory(
      req.user.id,
      req.query
    );
    res.json({
      success: true,
      history
    });
  })
);

module.exports = router;