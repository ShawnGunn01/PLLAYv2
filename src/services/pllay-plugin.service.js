const config = require('../config/pllay');

class PLLAYPluginService {
  constructor() {
    this.isInitialized = false;
    this.currentGame = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      await window.PLLAY.invokeManaged({
        public_key: config.PUBLIC_KEY,
        base_url: config.PLLAY_API_URL,
        player_base_url: config.PLAYER_BASE_URL,
        analyticsEnv: process.env.NODE_ENV
      });

      this.isInitialized = true;
      console.log('PLLAY plugin initialized successfully');
    } catch (error) {
      console.error('PLLAY plugin initialization failed:', error);
      throw error;
    }
  }

  async startGame() {
    if (!this.isInitialized) {
      throw new Error('PLLAY plugin not initialized');
    }

    try {
      const gameSession = await window.PLLAY.startGame();
      this.currentGame = gameSession;
      
      return {
        status: gameSession.status,
        roundId: gameSession._id,
        tournamentId: gameSession.tournamentId,
        playerId: gameSession.playerId
      };
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  }

  async endGame(score, encryptionKey = null) {
    if (!this.isInitialized || !this.currentGame) {
      throw new Error('No active game session');
    }

    try {
      const payload = {
        score,
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      // Add encryption if key is provided
      if (encryptionKey) {
        payload.encryptionKey = encryptionKey;
      }

      const result = await window.PLLAY.endGame(payload);
      this.currentGame = null;

      return result;
    } catch (error) {
      console.error('Failed to end game:', error);
      throw error;
    }
  }

  registerGameStartCallback(callback) {
    if (!this.isInitialized) {
      throw new Error('PLLAY plugin not initialized');
    }

    window.PLLAY.onGameStart((gameSession) => {
      this.currentGame = gameSession;
      callback(gameSession);
    });
  }

  registerGameEndCallback(callback) {
    if (!this.isInitialized) {
      throw new Error('PLLAY plugin not initialized');
    }

    window.PLLAY.onGameEnd((result) => {
      this.currentGame = null;
      callback(result);
    });
  }

  getCurrentGame() {
    return this.currentGame;
  }

  isGameActive() {
    return !!this.currentGame;
  }
}

module.exports = new PLLAYPluginService();