const express = require('express');
const router = express.Router();
const scoreService = require('../services/score.service');
const { validate, validateResponse } = require('../middleware/validate.middleware');
const { requireAuth, requireGameSecretKey } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/async.middleware');
const { 
  createScoreSchema, 
  updateScoreSchema, 
  validateScoreSchema,
  scoreResponseSchema 
} = require('../validation/schemas/score.schema');
const { errorResponseSchema } = require('../validation/schemas/base.schema');

router.post('/',
  requireGameSecretKey,
  validate(createScoreSchema),
  validateResponse(scoreResponseSchema),
  asyncHandler(async (req, res) => {
    const scoreType = await scoreService.createScoreType(req.validatedData);

    res.json({
      success: true,
      scoreType
    });
  })
);

router.patch('/:scoreTypeId',
  requireGameSecretKey,
  validate(updateScoreSchema),
  validateResponse(scoreResponseSchema),
  asyncHandler(async (req, res) => {
    const { scoreTypeId } = req.params;
    const scoreType = await scoreService.updateScoreType(scoreTypeId, req.validatedData);

    res.json({
      success: true,
      scoreType
    });
  })
);

router.post('/:scoreTypeId/validate',
  requireAuth,
  validate(validateScoreSchema),
  validateResponse(scoreResponseSchema),
  asyncHandler(async (req, res) => {
    const { scoreTypeId } = req.params;
    const { score } = req.validatedData;

    await scoreService.validateScore(score, scoreTypeId);

    res.json({
      success: true,
      message: 'Score is valid'
    });
  })
);

// Error handler
router.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

module.exports = router;