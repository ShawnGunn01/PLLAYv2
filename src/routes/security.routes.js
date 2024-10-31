const express = require('express');
const router = express.Router();
const securityService = require('../services/security.service');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { securitySchema } = require('../validation/schemas/security.schema');
const asyncHandler = require('../middleware/async.middleware');
const rateLimit = require('../middleware/rate-limit.middleware');

// Rate limit for 2FA attempts
const tfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

// Setup 2FA
router.post('/2fa/setup',
  requireAuth,
  asyncHandler(async (req, res) => {
    const setup = await securityService.setup2FA(req.user.id);
    res.json({
      success: true,
      ...setup
    });
  })
);

// Verify 2FA
router.post('/2fa/verify',
  requireAuth,
  tfaLimiter,
  validate(securitySchema.verify2FA),
  asyncHandler(async (req, res) => {
    const verified = await securityService.verify2FA(
      req.user.id,
      req.body.token
    );
    res.json({
      success: true,
      verified
    });
  })
);

// Monitor transaction
router.post('/monitor/transaction',
  requireAuth,
  validate(securitySchema.monitorTransaction),
  asyncHandler(async (req, res) => {
    const result = await securityService.monitorTransaction(
      req.user.id,
      req.body
    );
    res.json({
      success: true,
      ...result
    });
  })
);

module.exports = router;