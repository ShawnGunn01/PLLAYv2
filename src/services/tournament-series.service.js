const fetch = require('node-fetch');
const config = require('../config/pllay');

class TournamentSeriesService {
  constructor() {
    this.baseUrl = config.PLLAY_API_URL;
  }

  async createTournamentSeries({
    name,
    description,
    gameMode,
    maxSetDuration,
    penaltyPoints,
    startTime,
    duration,
    frequency,
    stageMode = 'BRACKET'
  }) {
    // Convert duration to seconds
    const durationInSeconds = this.convertToSeconds(duration);
    const frequencyInSeconds = this.convertToSeconds(frequency);

    if (frequencyInSeconds <= durationInSeconds) {
      throw new Error('Frequency must be greater than duration');
    }

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
          name,
          description,
          schedule: {
            startTime: new Date(startTime).toISOString(),
            duration: durationInSeconds,
            frequency: frequencyInSeconds
          },
          options: {
            gameModeId: gameMode,
            maxSetDuration: maxSetDuration * 60, // Convert to seconds
            penaltyPoints,
            stages: [{
              mode: stageMode,
              settings: this.getDefaultStageSettings(stageMode)
            }]
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
    switch (mode) {
      case 'BRACKET':
        return {
          endCondition: {
            type: 'PLAYERS_LEFT',
            value: 1
          },
          matchTemplate: {
            maxSets: 1,
            matchEndCondition: 1,
            playersInSet: 2,
            minPlayersInSet: 2,
            waitTimeForPlayer: 60,
            matchPoints: '1,0',
            tournamentPoints: '1,0'
          }
        };
      default:
        throw new Error(`Unsupported stage mode: ${mode}`);
    }
  }

  convertToSeconds(duration) {
    if (typeof duration === 'number') {
      return duration;
    }

    const { days = 0, hours = 0, minutes = 0, seconds = 0 } = duration;
    return (days * 86400) + (hours * 3600) + (minutes * 60) + seconds;
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
    return this.updateTournamentSeries(seriesId, { status: 'PAUSED' });
  }

  async resumeTournamentSeries(seriesId) {
    return this.updateTournamentSeries(seriesId, { status: 'ACTIVE' });
  }

  async getTournamentSeriesList() {
    const response = await fetch(`${this.baseUrl}/rpc/GetTournamentSeries`, {
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
      throw new Error(`Failed to get tournament series list: ${data.error.code}`);
    }

    return data.result.series;
  }

  validateTournamentSeriesConfig({
    startTime,
    duration,
    frequency,
    maxSetDuration
  }) {
    const now = new Date();
    const start = new Date(startTime);

    if (start < now) {
      throw new Error('Start time must be in the future');
    }

    const durationInSeconds = this.convertToSeconds(duration);
    const frequencyInSeconds = this.convertToSeconds(frequency);

    if (frequencyInSeconds <= durationInSeconds) {
      throw new Error('Frequency must be greater than duration');
    }

    if (maxSetDuration <= 0) {
      throw new Error('Max set duration must be positive');
    }

    return true;
  }
}

module.exports = new TournamentSeriesService();