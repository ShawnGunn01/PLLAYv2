const { PLLAYError } = require('../errors');

class PLLAYiOSService {
  constructor() {
    this.isInitialized = false;
    this.currentGame = null;
    this.callbacks = new Map();
    
    // Bind native callback handlers
    this.handleGameSetStart = this.handleGameSetStart.bind(this);
    this.handleGameSetEnd = this.handleGameSetEnd.bind(this);
    this.handleMatchStart = this.handleMatchStart.bind(this);
    this.handleMatchEnd = this.handleMatchEnd.bind(this);
  }

  async initialize(config) {
    if (this.isInitialized) {
      return true;
    }

    if (!window.webkit?.messageHandlers?.PLLAYService) {
      throw new PLLAYError('PLLAY iOS SDK not available');
    }

    try {
      const response = await this.callNative('initialize', {
        publicKey: config.PUBLIC_KEY,
        baseUrl: config.BASE_URL || 'https://api.pllay.io',
        playerBaseUrl: config.PLAYER_BASE_URL || 'https://player.pllay.io',
        autoReconnect: config.autoReconnect !== false
      });

      this.isInitialized = true;
      return response;
    } catch (error) {
      throw new PLLAYError('Failed to initialize PLLAY iOS SDK', error);
    }
  }

  async startGame() {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY iOS SDK not initialized');
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

  setButtonVisibility(visible) {
    return this.callNative('setButtonVisibility', { visible });
  }

  setButtonPosition(x, y, isRelative = false) {
    const method = isRelative ? 'setButtonDefaultPositionRelative' : 'setButtonDefaultPositionAbsolute';
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

  async registerInGamePlayerId(playerId, metadata = '') {
    if (!playerId || typeof playerId !== 'string') {
      throw new PLLAYError('Invalid player ID');
    }

    return this.callNative('registerInGamePlayerId', {
      playerId,
      metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
    });
  }

  async followDeepLink(link) {
    if (!link) {
      throw new PLLAYError('Deep link is required');
    }

    return this.callNative('followDeepLink', { link });
  }

  // Native callback handlers
  handleGameSetStart(payload) {
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
  }

  handleGameSetEnd(payload) {
    const callback = this.callbacks.get('gameSetEnd');
    if (callback) {
      callback({
        setId: payload.setId,
        matchId: payload.matchId
      });
    }
  }

  handleMatchStart(payload) {
    const callback = this.callbacks.get('matchStart');
    if (callback) {
      callback({
        matchId: payload.matchId
      });
    }
  }

  handleMatchEnd(payload) {
    const callback = this.callbacks.get('matchEnd');
    if (callback) {
      callback({
        matchId: payload.matchId
      });
    }
  }

  // Helper methods
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
      window.webkit.messageHandlers.PLLAYService.postMessage({
        method,
        params,
        callId
      });
    });
  }
}

module.exports = new PLLAYiOSService();