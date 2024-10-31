const express = require('express');
const router = express.Router();
const kycService = require('../services/kyc.service');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { kycSchema } = require('../validation/schemas/kyc.schema');
const asyncHandler = require('../middleware/async.middleware');

// Create link token for identity verification
router.post('/link-token',
  requireAuth,
  asyncHandler(async (req, res) => {
    const linkToken = await kycService.createLinkToken(req.user.id);
    res.json({
      success: true,
      linkToken
    });
  })
);

// Verify identity with Plaid public token
router.post('/verify',
  requireAuth,
  validate(kycSchema.verify),
  asyncHandler(async (req, res) => {
    const { publicToken } = req.body;
    const result = await kycService.verifyIdentity(req.user.id, publicToken);
    res.json({
      success: true,
      verification: result
    });
  })
);

// Get verification status
router.get('/status/:verificationId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const status = await kycService.getVerificationStatus(req.params.verificationId);
    res.json({
      success: true,
      status
    });
  })
);

// Retry failed verification
router.post('/retry/:verificationId',
  requireAuth,
  validate(kycSchema.retry),
  asyncHandler(async (req, res) => {
    const { template } = req.body;
    const result = await kycService.retryVerification(
      req.params.verificationId,
      template
    );
    res.json({
      success: true,
      verification: result
    });
  })
);

// Plaid webhook endpoint
router.post('/webhook',
  asyncHandler(async (req, res) => {
    await kycService.handleWebhook(req.body);
    res.json({ success: true });
  })
);

module.exports = router;