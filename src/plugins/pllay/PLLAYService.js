const config = require('./config');
const { PLLAYError } = require('./errors');
const CallbackManager = require('./callbacks/CallbackManager');

class PLLAYService {
  constructor() {
    this.isInitialized = false;
    this.currentGame = null;
    this.callbackManager = null;
    this.initPromise = null;
  }

  async initialize(userConfig = {}) {
    if (this.isInitialized) {
      return true;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        if (typeof window === 'undefined' || !window.PLLAY) {
          throw new PLLAYError('PLLAY SDK not loaded');
        }

        const validConfig = config.validate(userConfig);
        await window.PLLAY.invokeManaged(validConfig);

        this.callbackManager = new CallbackManager(this);
        this.isInitialized = true;
        resolve(true);
      } catch (error) {
        reject(new PLLAYError('Failed to initialize PLLAY', error));
      } finally {
        this.initPromise = null;
      }
    });

    return this.initPromise;
  }

  onGameSetStart(callback) {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }
    this.callbackManager.on('gameSetStart', callback);
    return this;
  }

  onGameSetEnd(callback) {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }
    this.callbackManager.on('gameSetEnd', callback);
    return this;
  }

  onMatchStart(callback) {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }
    this.callbackManager.on('matchStart', callback);
    return this;
  }

  onMatchEnd(callback) {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }
    this.callbackManager.on('matchEnd', callback);
    return this;
  }

  async startGame() {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }

    try {
      const gameSession = await window.PLLAY.startGame();
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
      const result = await window.PLLAY.endGame(score);
      this.currentGame = null;
      return result;
    } catch (error) {
      throw new PLLAYError('Failed to end game', error);
    }
  }

  async maybeShowNotifications() {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }

    return window.PLLAY.maybeShowNotifications();
  }

  async maybeShowAnnouncements() {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }

    return window.PLLAY.maybeShowAnnouncements();
  }

  isGameActive() {
    return !!this.currentGame;
  }

  getCurrentGame() {
    return this.currentGame;
  }
}

module.exports = new PLLAYService();