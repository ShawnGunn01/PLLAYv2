const express = require('express');
const router = express.Router();
const sweepstakesService = require('../services/sweepstakes.service');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { sweepstakesSchema } = require('../validation/schemas/sweepstakes.schema');
const asyncHandler = require('../middleware/async.middleware');

// Create sweepstakes (admin only)
router.post('/',
  requireAuth,
  requireAdmin,
  validate(sweepstakesSchema.create),
  asyncHandler(async (req, res) => {
    const sweepstakes = await sweepstakesService.createSweepstakes(req.body);
    res.json({
      success: true,
      sweepstakes
    });
  })
);

// Enter sweepstakes
router.post('/:sweepstakesId/enter',
  requireAuth,
  validate(sweepstakesSchema.enter),
  asyncHandler(async (req, res) => {
    const result = await sweepstakesService.enterSweepstakes(
      req.params.sweepstakesId,
      req.user.id,
      req.body.entries
    );
    res.json({
      success: true,
      ...result
    });
  })
);

// Get active sweepstakes
router.get('/active',
  asyncHandler(async (req, res) => {
    const sweepstakes = await sweepstakesService.getActiveSweepstakes();
    res.json({
      success: true,
      sweepstakes
    });
  })
);

// Draw winners (admin only)
router.post('/:sweepstakesId/draw',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const winners = await sweepstakesService.drawWinners(
      req.params.sweepstakesId
    );
    res.json({
      success: true,
      winners
    });
  })
);

module.exports = router;