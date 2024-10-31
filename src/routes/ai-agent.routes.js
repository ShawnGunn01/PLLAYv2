const express = require('express');
const router = express.Router();
const aiAgentService = require('../services/ai-agent.service');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { aiAgentSchema } = require('../validation/schemas/ai-agent.schema');
const asyncHandler = require('../middleware/async.middleware');
const rateLimit = require('../middleware/rate-limit.middleware');

// Rate limit for AI requests
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20 // limit each IP to 20 requests per minute
});

// Web chat message
router.post('/chat',
  requireAuth,
  aiLimiter,
  validate(aiAgentSchema.message),
  asyncHandler(async (req, res) => {
    const response = await aiAgentService.handleMessage(
      req.user.id,
      req.body.message,
      'web'
    );
    res.json({
      success: true,
      response
    });
  })
);

// SMS webhook
router.post('/sms/webhook',
  validate(aiAgentSchema.smsWebhook),
  asyncHandler(async (req, res) => {
    const { from, message, userId } = req.body;
    
    const response = await aiAgentService.handleMessage(
      userId,
      message,
      'sms'
    );

    res.json({
      success: true,
      response: {
        to: from,
        message: response
      }
    });
  })
);

// iMessage webhook
router.post('/imessage/webhook',
  validate(aiAgentSchema.iMessageWebhook),
  asyncHandler(async (req, res) => {
    const { from, message, userId } = req.body;
    
    const response = await aiAgentService.handleMessage(
      userId,
      message,
      'imessage'
    );

    res.json({
      success: true,
      response: {
        to: from,
        message: response
      }
    });
  })
);

module.exports = router;