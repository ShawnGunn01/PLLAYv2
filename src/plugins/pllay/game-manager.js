const { PLLAYError } = require('./errors');
const { validateScore } = require('./validators');
const { encryptScore } = require('./crypto');

class GameManager {
  constructor(service) {
    this.service = service;
    this.currentGame = null;
    this.scoreTypes = new Set(['points', 'points_extra']);
  }

  async startGame() {
    if (!this.service.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }

    try {
      const gameSession = await this.service.startGame();
      this.currentGame = gameSession;
      return gameSession;
    } catch (error) {
      throw new PLLAYError('Failed to start game', error);
    }
  }

  async endGame(score) {
    if (!this.currentGame) {
      throw new PLLAYError('No active game session');
    }

    try {
      validateScore(score, this.scoreTypes);
      const result = await this.service.endGame(score);
      this.currentGame = null;
      return result;
    } catch (error) {
      throw new PLLAYError('Failed to end game', error);
    }
  }

  async endGameEncrypted(keyProvider, score) {
    if (typeof keyProvider !== 'function') {
      throw new PLLAYError('Key provider must be a function');
    }

    try {
      const key = keyProvider();
      if (!key || typeof key !== 'string') {
        throw new PLLAYError('Invalid encryption key');
      }

      validateScore(score, this.scoreTypes);
      const encryptedScore = encryptScore(score, key);
      
      return this.endGame({
        ...encryptedScore,
        encrypted: true
      });
    } catch (error) {
      throw new PLLAYError('Failed to end game with encryption', error);
    }
  }

  setScoreTypes(types) {
    if (!Array.isArray(types)) {
      throw new PLLAYError('Score types must be an array');
    }
    this.scoreTypes = new Set(types);
  }

  isGameActive() {
    return !!this.currentGame;
  }

  getCurrentGame() {
    return this.currentGame;
  }
}

module.exports = GameManager;