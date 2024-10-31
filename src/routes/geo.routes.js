const express = require('express');
const router = express.Router();
const geoService = require('../services/geo.service');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { geoSchema } = require('../validation/schemas/geo.schema');
const asyncHandler = require('../middleware/async.middleware');
const rateLimit = require('../middleware/rate-limit.middleware');

// Rate limit for location checks
const locationCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Check user's location
router.post('/check',
  locationCheckLimiter,
  requireAuth,
  validate(geoSchema.locationCheck),
  asyncHandler(async (req, res) => {
    const ipAddress = req.body.ip || req.ip;
    const gameType = req.body.gameType;
    
    const result = await geoService.checkLocation(ipAddress, gameType);
    
    // Log check for compliance
    await db('location_checks').insert({
      user_id: req.user.id,
      ip_address: ipAddress,
      location: result.location,
      vpn: result.vpn,
      allowed: result.allowed,
      restrictions: result.restrictions,
      checked_at: new Date()
    });

    res.json({
      success: true,
      ...result
    });
  })
);

// Create geofence (admin only)
router.post('/geofence',
  requireAuth,
  requireAdmin,
  validate(geoSchema.createGeofence),
  asyncHandler(async (req, res) => {
    const geofence = await geoService.createGeofence(
      req.body.name,
      req.body
    );
    res.json({
      success: true,
      geofence
    });
  })
);

// Check if location is within geofence
router.post('/geofence/:geofenceId/check',
  requireAuth,
  validate(geoSchema.checkGeofence),
  asyncHandler(async (req, res) => {
    const result = await geoService.checkGeofence(
      req.body.location,
      req.params.geofenceId
    );

    // Log check
    await db('geofence_logs').insert({
      geofence_id: req.params.geofenceId,
      user_id: req.user.id,
      inside: result.inside,
      distance: result.distance,
      location: req.body.location,
      checked_at: new Date()
    });

    res.json({
      success: true,
      ...result
    });
  })
);

module.exports = router;