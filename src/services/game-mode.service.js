const fetch = require('node-fetch');
const config = require('../config/pllay');

class GameModeService {
  constructor() {
    this.baseUrl = config.PLLAY_API_URL;
  }

  async createGameMode({
    name,
    description,
    type = 'MULTIPLAYER',
    maxSetDuration,
    minParticipants,
    maxParticipants,
    penaltyPoints,
    setParameters = {},
    isPublic = true
  }) {
    const response = await fetch(`${this.baseUrl}/rpc/CreateGameMode`, {
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
        gameMode: {
          gameId: config.GAME_ID,
          name,
          description,
          type,
          options: {
            maxSetDuration,
            minParticipantsInSet: minParticipants,
            maxParticipantsInSet: maxParticipants,
            penaltyPoints,
            setParameters: JSON.stringify(setParameters)
          },
          status: isPublic ? 'ACTIVE' : 'HIDDEN'
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to create game mode: ${data.error.code}`);
    }

    return data.result;
  }

  async updateGameMode(gameModeId, updates) {
    const response = await fetch(`${this.baseUrl}/rpc/UpdateGameMode`, {
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
        gameModeId,
        updates
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to update game mode: ${data.error.code}`);
    }

    return data.result;
  }

  async validateGameMode(gameModeId, playersCount) {
    const response = await fetch(`${this.baseUrl}/rpc/GetGameMode`, {
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
        gameModeId
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to validate game mode: ${data.error.code}`);
    }

    const gameMode = data.result;
    if (playersCount < gameMode.options.minParticipantsInSet) {
      throw new Error(`Minimum ${gameMode.options.minParticipantsInSet} players required`);
    }

    if (playersCount > gameMode.options.maxParticipantsInSet) {
      throw new Error(`Maximum ${gameMode.options.maxParticipantsInSet} players allowed`);
    }

    return true;
  }

  parseSetParameters(parameters) {
    try {
      return typeof parameters === 'string' ? JSON.parse(parameters) : parameters;
    } catch (error) {
      throw new Error('Invalid set parameters format');
    }
  }
}

module.exports = new GameModeService();