const { PLLAYError } = require('../errors');
const EventEmitter = require('events');

class PLLAYAndroidService extends EventEmitter {
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

    if (!window.PLLAYAndroid) {
      throw new PLLAYError('PLLAY Android SDK not available');
    }

    try {
      const response = await this.callNative('initialize', {
        publicKey: config.PUBLIC_KEY,
        baseUrl: config.BASE_URL || 'https://api.pllay.io',
        playerBaseUrl: config.PLAYER_BASE_URL || 'https://player.pllay.io'
      });

      this.isInitialized = true;
      this.setupCallbacks();
      return response;
    } catch (error) {
      throw new PLLAYError('Failed to initialize PLLAY Android SDK', error);
    }
  }

  setupCallbacks() {
    window.PLLAYAndroid.registerCallback('onGameSetStart', (payload) => {
      const callback = this.callbacks.get('gameSetStart');
      if (callback) {
        callback({
          setId: payload.setId,
          tournamentId: payload.tournamentId,
          matchId: payload.matchId,
          roundId: payload.roundId,
          globalMetadata: payload.globalMetadata,
          setEndTimeUnix: payload.setEndTimeUnix,
          participants: this.normalizeParticipants(payload.participants)
        });
      }
    });

    window.PLLAYAndroid.registerCallback('onGameSetEnd', (payload) => {
      const callback = this.callbacks.get('gameSetEnd');
      if (callback) {
        callback({
          setId: payload.setId,
          matchId: payload.matchId
        });
      }
    });

    window.PLLAYAndroid.registerCallback('onMatchStart', (payload) => {
      const callback = this.callbacks.get('matchStart');
      if (callback) {
        callback({
          matchId: payload.matchId
        });
      }
    });

    window.PLLAYAndroid.registerCallback('onMatchEnd', (payload) => {
      const callback = this.callbacks.get('matchEnd');
      if (callback) {
        callback({
          matchId: payload.matchId
        });
      }
    });
  }

  async startGame() {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY Android SDK not initialized');
    }

    try {
      const response = await this.callNative('startGame');
      this.currentGame = {
        roundId: response.roundId,
        tournamentId: response.tournamentId,
        status: response.status,
        playerId: response.playerId
      };
      return this.currentGame;
    } catch (error) {
      throw new PLLAYError('Failed to start game', error);
    }
  }

  async endGame(score) {
    if (!this.currentGame) {
      throw new PLLAYError('No active game session');
    }

    try {
      const response = await this.callNative('endGame', { score });
      this.currentGame = null;
      return response;
    } catch (error) {
      throw new PLLAYError('Failed to end game', error);
    }
  }

  async progressGame(score) {
    if (!this.currentGame) {
      throw new PLLAYError('No active game session');
    }

    try {
      return await this.callNative('progressGame', { score });
    } catch (error) {
      throw new PLLAYError('Failed to update game progress', error);
    }
  }

  async registerInGamePlayerId(playerId, metadata = '') {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY Android SDK not initialized');
    }

    try {
      return await this.callNative('registerInGamePlayerId', {
        playerId,
        metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
      });
    } catch (error) {
      throw new PLLAYError('Failed to register player ID', error);
    }
  }

  setButtonVisibility(visible) {
    return this.callNative('setButtonVisibility', { visible });
  }

  setButtonPosition(x, y, isRelative = false) {
    const method = isRelative ? 'setDefaultPositionRelative' : 'setDefaultPositionAbsolute';
    return this.callNative(method, { x, y });
  }

  openEscsView() {
    return this.callNative('openEscsView');
  }

  async maybeShowNotifications() {
    return this.callNative('maybeShowNotifications');
  }

  async maybeShowAnnouncements() {
    return this.callNative('maybeShowAnnouncements');
  }

  async followDeepLink(link) {
    if (!link) {
      throw new PLLAYError('Deep link is required');
    }

    return this.callNative('followDeepLink', { link });
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

  callNative(method, params = {}) {
    return new Promise((resolve, reject) => {
      const callId = Date.now().toString();
      
      // Register callback
      window[`pllay_callback_${callId}`] = (response) => {
        delete window[`pllay_callback_${callId}`];
        
        if (response.error) {
          reject(new PLLAYError(response.error));
        } else {
          resolve(response.result);
        }
      };

      // Call native method
      window.PLLAYAndroid.postMessage(JSON.stringify({
        method,
        params,
        callId
      }));
    });
  }
}

module.exports = new PLLAYAndroidService();