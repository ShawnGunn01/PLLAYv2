const twilio = require('twilio');
const { PLLAYError } = require('../utils/errors');

function validateTwilioRequest(req, res, next) {
  const twilioSignature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    url,
    req.body
  );

  if (!isValid) {
    throw new PLLAYError('Invalid Twilio request signature');
  }

  next();
}