const express = require('express');
const router = express.Router();
const oauthService = require('../services/oauth.service');
const validate = require('../middleware/validate.middleware');
const { oauthCallbackSchema, connectionStatusSchema } = require('../validation/schemas/oauth.schema');
const asyncHandler = require('../middleware/async.middleware');
const { AuthenticationError } = require('../utils/errors');
const rateLimit = require('../middleware/rate-limit.middleware');

// Rate limit for OAuth endpoints
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.get('/auth-url', oauthLimiter, asyncHandler((req, res) => {
  const authUrl = oauthService.generateAuthUrl();
  res.json({
    success: true,
    authUrl,
    message: `Please connect your account to proceed. Login or register on the next screen.`
  });
}));

router.get('/callback', 
  oauthLimiter,
  validate(oauthCallbackSchema),
  asyncHandler(async (req, res) => {
    const { code } = req.query;
    
    // Process OAuth flow
    const userInfo = await oauthService.handleOAuthFlow(code);
    
    res.json({
      success: true,
      message: 'Account connected successfully',
      userId: userInfo.userId
    });
  })
);

router.get('/status/:userId',
  validate(connectionStatusSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { authToken } = req.headers;

    if (!authToken) {
      throw new AuthenticationError('Authentication required');
    }

    const userInfo = await oauthService.getUserInfo(authToken);

    res.json({
      success: true,
      connected: userInfo.userId === userId,
      userId: userInfo.userId
    });
  })
);

module.exports = router;