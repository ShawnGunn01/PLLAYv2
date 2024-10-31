const fetch = require('node-fetch');
const config = require('../config/pllay');

class GameService {
  constructor() {
    this.baseUrl = config.PLLAY_API_URL;
    this.storageUrl = 'https://storage.pllay.io/file';
  }

  async getGames(offset = 0, limit = 20) {
    const response = await fetch(`${this.baseUrl}/rpc/GetGames`, {
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
        filters: {
          offset,
          limit
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.code);
    }

    const games = data.result.rows.map(game => ({
      ...game,
      logo: game.logo ? `${this.storageUrl}/${game.logo}` : null
    }));

    return {
      games,
      count: data.result.count,
      offset: data.result.offset,
      limit: data.result.limit
    };
  }

  async getGameScoreTypes(gameId) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    const response = await fetch(`${this.baseUrl}/rpc/GetGameScoreTypes`, {
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
        filters: {
          conditions: {
            gameId: {
              $eq: gameId
            },
            status: {
              $eq: 'ACTIVE'
            }
          }
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.code);
    }

    const scoreTypes = data.result.rows.map(score => ({
      id: score._id,
      name: score.name,
      description: score.description,
      sorting: score.sorting === 1 ? 'higher_better' : 'lower_better'
    }));

    return {
      scoreTypes,
      count: data.result.count
    };
  }

  async getGameModes(gameId) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    const response = await fetch(`${this.baseUrl}/rpc/GetGameModes`, {
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
        filters: {
          conditions: {
            gameId: {
              $eq: gameId
            },
            status: {
              $eq: 'ACTIVE'
            }
          }
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.code);
    }

    // Transform the response to include relevant information
    const gameModes = data.result.rows.map(mode => ({
      id: mode._id,
      name: mode.name,
      description: mode.description,
      type: mode.type,
      maxPlayers: mode.options.maxParticipantsInSet,
      minPlayers: mode.options.minParticipantsInSet,
      maxSetDuration: mode.options.maxSetDuration,
      penaltyPoints: mode.options.penaltyPoints
    }));

    return {
      gameModes,
      count: data.result.count
    };
  }

  validateGameMode(gameMode, playersCount) {
    if (!gameMode || !playersCount) {
      throw new Error('Game mode and players count are required');
    }

    if (playersCount > gameMode.maxPlayers) {
      throw new Error(`Maximum ${gameMode.maxPlayers} players allowed for this game mode`);
    }

    if (playersCount < gameMode.minPlayers) {
      throw new Error(`Minimum ${gameMode.minPlayers} players required for this game mode`);
    }

    return true;
  }
}

module.exports = new GameService();