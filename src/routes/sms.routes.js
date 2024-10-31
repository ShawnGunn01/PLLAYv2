const express = require('express');
const router = express.Router();
const smsService = require('../services/sms.service');
const { validateTwilioRequest } = require('../middleware/twilio.middleware');
const asyncHandler = require('../middleware/async.middleware');

// Twilio webhook for incoming messages
router.post('/webhook',
  validateTwilioRequest,
  asyncHandler(async (req, res) => {
    await smsService.handleIncomingMessage(req.body);
    res.type('text/xml').send('<Response></Response>');
  })
);

module.exports = router;