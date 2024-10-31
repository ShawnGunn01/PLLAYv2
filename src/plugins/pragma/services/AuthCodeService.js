const fetch = require('node-fetch');
const { PLLAYError } = require('../../pllay/errors');

class AuthCodeService {
  constructor(config) {
    this.baseUrl = config.PRAGMA_API_URL;
    this.applicationId = config.AUTH_CODE_APPLICATION_ID;
    this.applicationSecret = config.AUTH_CODE_APPLICATION_SECRET;
  }

  async requestAuthCode(playerId) {
    const response = await fetch(`${this.baseUrl}/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.applicationSecret}`
      },
      body: JSON.stringify({
        requestId: Date.now(),
        type: 'AuthCodeRpc.AuthCodeV1Request',
        payload: {
          playerId
        }
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new PLLAYError(data.error?.message || 'Failed to get auth code');
    }

    return data.response.payload;
  }
}

module.exports = AuthCodeService;