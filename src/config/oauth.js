require('dotenv').config();

module.exports = {
  PLLAY_OAUTH_URL: process.env.PLLAY_OAUTH_URL || 'https://account.demo.pllay.io',
  PLLAY_OAUTH_API: process.env.PLLAY_OAUTH_API || 'https://oauth.demo.pllay.io',
  OAUTH_APP_ID: process.env.OAUTH_APP_ID,
  OAUTH_SECRET_KEY: process.env.OAUTH_SECRET_KEY,
  REDIRECT_URL: process.env.REDIRECT_URL || 'http://localhost:3000/oauth/callback',
  SERVICE_NAME: process.env.SERVICE_NAME || 'PLLAY Game Service'
};