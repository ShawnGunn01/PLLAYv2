const fetch = require('node-fetch');
const config = require('../config/pllay');

class GameRegistrationService {
  constructor() {
    this.baseUrl = config.PLLAY_API_URL;
  }

  async registerGame({
    name,
    description,
    type = 'PUBLIC_TOURNAMENT',
    logo = null
  }) {
    const response = await fetch(`${this.baseUrl}/rpc/CreateGame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        },
        game: {
          name,
          description,
          type,
          logo
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Game registration failed: ${data.error.code}`);
    }

    return data.result;
  }

  async createGameScore({
    name,
    description,
    identifier,
    sorting = 'DESC'
  }) {
    const response = await fetch(`${this.baseUrl}/rpc/CreateGameScoreType`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        },
        scoreType: {
          gameId: config.GAME_ID,
          name,
          description,
          identifier,
          sorting: sorting === 'DESC' ? 1 : -1,
          status: 'ACTIVE'
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Score type creation failed: ${data.error.code}`);
    }

    return data.result;
  }

  async createReferral(name) {
    const response = await fetch(`${this.baseUrl}/rpc/CreateReferral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        },
        referral: {
          name,
          gameId: config.GAME_ID
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Referral creation failed: ${data.error.code}`);
    }

    return data.result;
  }

  async createGameView({
    name,
    referralId,
    integrationType,
    customization = {}
  }) {
    const response = await fetch(`${this.baseUrl}/rpc/CreateGameView`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        },
        view: {
          name,
          gameId: config.GAME_ID,
          referralId,
          integrationType,
          customization
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Game view creation failed: ${data.error.code}`);
    }

    return {
      ...data.result,
      publicKey: data.result.publicKey,
      playerBaseUrl: data.result.playerBaseUrl
    };
  }

  async getGameDetails() {
    const response = await fetch(`${this.baseUrl}/rpc/GetGame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to get game details: ${data.error.code}`);
    }

    return data.result;
  }
}

module.exports = new GameRegistrationService();