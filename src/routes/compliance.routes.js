const express = require('express');
const router = express.Router();
const complianceService = require('../services/compliance.service');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { complianceSchema } = require('../validation/schemas/compliance.schema');
const asyncHandler = require('../middleware/async.middleware');

// Generate compliance report (admin only)
router.post('/report',
  requireAuth,
  requireAdmin,
  validate(complianceSchema.report),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.body;
    const report = await complianceService.generateComplianceReport(
      startDate,
      endDate
    );
    res.json({
      success: true,
      report
    });
  })
);

// Flag suspicious activity
router.post('/suspicious-activity',
  requireAuth,
  requireAdmin,
  validate(complianceSchema.suspiciousActivity),
  asyncHandler(async (req, res) => {
    const activity = await complianceService.flagSuspiciousActivity(
      req.body.userId,
      req.body
    );
    res.json({
      success: true,
      activity
    });
  })
);

// Update user risk level
router.post('/risk-level/:userId',
  requireAuth,
  requireAdmin,
  validate(complianceSchema.riskLevel),
  asyncHandler(async (req, res) => {
    const assessment = await complianceService.updateRiskLevel(
      req.params.userId,
      req.body.riskLevel,
      req.body.reason
    );
    res.json({
      success: true,
      assessment
    });
  })
);

module.exports = router;