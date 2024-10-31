const express = require('express');
const router = express.Router();
const profileService = require('../services/profile.service');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { profileSchema } = require('../validation/schemas/profile.schema');
const asyncHandler = require('../middleware/async.middleware');
const multer = require('multer');

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get user profile
router.get('/:userId',
  asyncHandler(async (req, res) => {
    const profile = await profileService.getProfile(req.params.userId);
    res.json({
      success: true,
      profile
    });
  })
);

// Update user profile
router.patch('/:userId',
  requireAuth,
  validate(profileSchema.update),
  asyncHandler(async (req, res) => {
    const profile = await profileService.updateProfile(
      req.params.userId,
      req.body
    );
    res.json({
      success: true,
      profile
    });
  })
);

// Get user stats
router.get('/:userId/stats',
  asyncHandler(async (req, res) => {
    const stats = await profileService.getStats(req.params.userId);
    res.json({
      success: true,
      stats
    });
  })
);

// Get user achievements
router.get('/:userId/achievements',
  asyncHandler(async (req, res) => {
    const achievements = await profileService.getAchievements(req.params.userId);
    res.json({
      success: true,
      achievements
    });
  })
);

// Update avatar
router.post('/:userId/avatar',
  requireAuth,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    const avatar = await profileService.updateAvatar(
      req.params.userId,
      req.file
    );
    res.json({
      success: true,
      avatar
    });
  })
);

module.exports = router;