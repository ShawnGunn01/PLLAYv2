const express = require('express');
const router = express.Router();
const adminService = require('../services/admin.service');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { adminSchema } = require('../validation/schemas/admin.schema');
const asyncHandler = require('../middleware/async.middleware');

// Get dashboard stats
router.get('/dashboard',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const stats = await adminService.getDashboardStats();
    res.json({
      success: true,
      stats
    });
  })
);

// Manage user
router.post('/users/:userId',
  requireAuth,
  requireAdmin,
  validate(adminSchema.userManagement),
  asyncHandler(async (req, res) => {
    const user = await adminService.manageUser(
      req.params.userId,
      req.body.action,
      req.body
    );
    res.json({
      success: true,
      user
    });
  })
);

// Manage tournament
router.post('/tournaments/:tournamentId',
  requireAuth,
  requireAdmin,
  validate(adminSchema.tournamentManagement),
  asyncHandler(async (req, res) => {
    const tournament = await adminService.manageTournament(
      req.params.tournamentId,
      req.body.action,
      req.body
    );
    res.json({
      success: true,
      tournament
    });
  })
);

// Review KYC
router.post('/kyc/:verificationId/review',
  requireAuth,
  requireAdmin,
  validate(adminSchema.kycReview),
  asyncHandler(async (req, res) => {
    const verification = await adminService.reviewKYC(
      req.params.verificationId,
      req.body.decision,
      req.body.notes
    );
    res.json({
      success: true,
      verification
    });
  })
);

module.exports = router;