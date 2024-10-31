const fetch = require('node-fetch');
const config = require('../config/oauth');

class OAuthService {
  constructor() {
    this.baseUrl = config.PLLAY_OAUTH_API;
  }

  generateAuthUrl() {
    const params = new URLSearchParams({
      app_id: config.OAUTH_APP_ID,
      code: config.OAUTH_SECRET_KEY,
      redirect_url: config.REDIRECT_URL,
      service_name: config.SERVICE_NAME,
      scope: 'CURRENT_SESSION_INFO'
    });

    return `${config.PLLAY_OAUTH_URL}/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(oneTimeCode) {
    const response = await fetch(`${this.baseUrl}/rpc/OAuthAuthorizationCodeExchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: Date.now().toString(),
        params: {
          code: oneTimeCode,
          application: {
            _id: config.OAUTH_APP_ID,
            secretKey: config.OAUTH_SECRET_KEY
          }
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`OAuth token exchange failed: ${data.error.code}`);
    }

    return data.result.session;
  }

  async getUserInfo(authToken) {
    const response = await fetch(`${this.baseUrl}/rpc/GetCurrentSessionInfo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: Date.now().toString(),
        params: {
          context: {
            type: 'USER',
            authToken
          }
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to get user info: ${data.error.code}`);
    }

    return data.result.session;
  }

  async handleOAuthFlow(oneTimeCode) {
    // Exchange code for tokens
    const { authToken, refreshToken } = await this.exchangeCodeForToken(oneTimeCode);
    
    // Get user info using the auth token
    const userInfo = await this.getUserInfo(authToken);

    return {
      userId: userInfo.userId,
      sessionId: userInfo._id,
      authToken,
      refreshToken
    };
  }
}

module.exports = new OAuthService();