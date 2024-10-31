const { PLLAYError } = require('../errors');
const EventEmitter = require('events');

class PLLAYService extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.currentGame = null;
    this.callbacks = new Map();
  }

  async initialize(config) {
    if (this.isInitialized) {
      return true;
    }

    try {
      await this.invokeManaged({
        public_key: config.PUBLIC_KEY,
        base_url: config.BASE_URL || 'https://api.pllay.io',
        player_base_url: config.PLAYER_BASE_URL || 'https://player.pllay.io',
        analyticsEnv: config.ANALYTICS_ENV || 'production'
      });

      this.isInitialized = true;
      this.setupCallbacks();
      return true;
    } catch (error) {
      throw new PLLAYError('Failed to initialize PLLAY', error);
    }
  }

  async startGame() {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY not initialized');
    }

    try {
      const gameSession = await this.callNative('startGame');
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
      const result = await this.callNative('endGame', { score });
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

      return await this.callNative('endGameEncrypted', { key, score });
    } catch (error) {
      throw new PLLAYError('Failed to end game with encryption', error);
    }
  }

  async maybeShowNotifications() {
    return this.callNative('maybeShowNotifications');
  }

  async maybeShowAnnouncements() {
    return this.callNative('maybeShowAnnouncements');
  }

  async getStatus() {
    return this.callNative('getStatus');
  }

  sendEvent(eventName, data) {
    return this.callNative('sendEvent', { eventName, data });
  }

  setupCallbacks() {
    if (this.nativeEventEmitter) {
      this.nativeEventEmitter.addListener('onGameSetStart', (payload) => {
        const callback = this.callbacks.get('gameSetStart');
        if (callback) {
          callback(this.normalizePayload(payload));
        }
      });

      this.nativeEventEmitter.addListener('onGameSetEnd', (payload) => {
        const callback = this.callbacks.get('gameSetEnd');
        if (callback) {
          callback(payload);
        }
      });

      this.nativeEventEmitter.addListener('onMatchStart', (payload) => {
        const callback = this.callbacks.get('matchStart');
        if (callback) {
          callback(payload);
        }
      });

      this.nativeEventEmitter.addListener('onMatchEnd', (payload) => {
        const callback = this.callbacks.get('matchEnd');
        if (callback) {
          callback(payload);
        }
      });
    }
  }

  normalizePayload(payload) {
    return {
      setId: payload.setId,
      tournamentId: payload.tournamentId,
      matchId: payload.matchId,
      roundId: payload.roundId,
      globalMetadata: payload.globalMetadata,
      setEndTimeUnix: payload.setEndTimeUnix,
      participants: this.normalizeParticipants(payload.participants)
    };
  }

  normalizeParticipants(participants) {
    return participants.map(team => 
      team.map(player => ({
        playerId: player.playerId,
        ingamePlayerId: player.ingamePlayerId,
        username: player.username,
        firstName: player.firstName,
        lastName: player.lastName,
        avatar: player.avatar,
        ingameMetadata: player.ingameMetadata
      }))
    );
  }

  onGameSetStart(callback) {
    this.callbacks.set('gameSetStart', callback);
    return this;
  }

  onGameSetEnd(callback) {
    this.callbacks.set('gameSetEnd', callback);
    return this;
  }

  onMatchStart(callback) {
    this.callbacks.set('matchStart', callback);
    return this;
  }

  onMatchEnd(callback) {
    this.callbacks.set('matchEnd', callback);
    return this;
  }

  async callNative(method, args = {}) {
    if (!this.nativeModule) {
      throw new PLLAYError('Native module not available');
    }

    try {
      return await this.nativeModule[method](args);
    } catch (error) {
      throw new PLLAYError(`Native call failed: ${method}`, error);
    }
  }
}

module.exports = new PLLAYService();