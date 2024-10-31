const fetch = require('node-fetch');
const config = require('../config/pllay');

class TournamentStructureService {
  constructor() {
    this.baseUrl = config.PLLAY_API_URL;
  }

  async createTournamentSeries({
    gameId,
    name,
    description,
    gameMode,
    scoreType,
    stages = [{
      mode: 'BRACKET',
      settings: this.getDefaultStageSettings('BRACKET')
    }]
  }) {
    const response = await fetch(`${this.baseUrl}/rpc/CreateTournamentSeries`, {
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
        series: {
          gameId,
          name,
          description,
          options: {
            gameModeId: gameMode,
            gameScoreType: scoreType,
            stages: stages.map(stage => ({
              mode: stage.mode,
              settings: stage.settings
            }))
          }
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to create tournament series: ${data.error.code}`);
    }

    return data.result;
  }

  getDefaultStageSettings(mode) {
    const defaults = {
      BRACKET: {
        endCondition: {
          type: 'PLAYERS_LEFT',
          value: 1
        },
        matchConfig: {
          maxSets: 1,
          playersPerMatch: 2,
          advancingPlayers: 1
        },
        scheduling: {
          matchDuration: 600, // 10 minutes
          breakBetweenMatches: 30
        }
      },
      ROUND_ROBIN: {
        endCondition: {
          type: 'ALL_MATCHES_COMPLETED'
        },
        matchConfig: {
          maxSets: 1,
          playersPerMatch: 2,
          matchesPerPairing: 1
        },
        scheduling: {
          matchDuration: 600,
          breakBetweenMatches: 30
        }
      }
    };

    return defaults[mode] || defaults.BRACKET;
  }

  async updateTournamentSeries(seriesId, updates) {
    const response = await fetch(`${this.baseUrl}/rpc/UpdateTournamentSeries`, {
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
        seriesId,
        updates
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to update tournament series: ${data.error.code}`);
    }

    return data.result;
  }

  async pauseTournamentSeries(seriesId) {
    return this.updateTournamentSeries(seriesId, {
      status: 'PAUSED'
    });
  }

  async replaceTournamentSeries(seriesId, newSeriesConfig) {
    const response = await fetch(`${this.baseUrl}/rpc/ReplaceTournamentSeries`, {
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
        seriesId,
        newSeries: newSeriesConfig
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to replace tournament series: ${data.error.code}`);
    }

    return data.result;
  }

  async getTournamentStages(tournamentId) {
    const response = await fetch(`${this.baseUrl}/rpc/GetTournamentStages`, {
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
        tournamentId
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to get tournament stages: ${data.error.code}`);
    }

    return data.result.stages;
  }

  async getStageRounds(stageId) {
    const response = await fetch(`${this.baseUrl}/rpc/GetStageRounds`, {
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
        stageId
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to get stage rounds: ${data.error.code}`);
    }

    return data.result.rounds;
  }

  validateStageSettings(mode, settings) {
    const defaultSettings = this.getDefaultStageSettings(mode);
    const requiredKeys = Object.keys(defaultSettings);
    
    const missingKeys = requiredKeys.filter(key => !settings[key]);
    if (missingKeys.length > 0) {
      throw new Error(`Missing required settings: ${missingKeys.join(', ')}`);
    }

    return true;
  }
}

module.exports = new TournamentStructureService();