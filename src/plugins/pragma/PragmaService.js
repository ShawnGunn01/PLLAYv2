const { PLLAYError } = require('../pllay/errors');
const EventEmitter = require('events');

class PragmaService extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.currentMatch = null;
    this.authCodeService = null;
    this.matchmakingService = null;
  }

  async initialize(config) {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Initialize auth code service
      this.authCodeService = await this.initializeAuthCodeService(config);
      
      // Initialize matchmaking service
      this.matchmakingService = await this.initializeMatchmakingService(config);

      this.isInitialized = true;
      this.emit('initialized');
      return true;
    } catch (error) {
      throw new PLLAYError('Failed to initialize Pragma service', error);
    }
  }

  async getAuthCode(playerId) {
    if (!this.isInitialized) {
      throw new PLLAYError('Pragma service not initialized');
    }

    try {
      const response = await this.authCodeService.requestAuthCode(playerId);
      return response.authCode;
    } catch (error) {
      throw new PLLAYError('Failed to get auth code', error);
    }
  }

  async queueForMatchmaking() {
    if (!this.isInitialized) {
      throw new PLLAYError('Pragma service not initialized');
    }

    try {
      const response = await this.matchmakingService.queueForMatch();
      this.currentMatch = response.match;
      return response;
    } catch (error) {
      throw new PLLAYError('Failed to queue for matchmaking', error);
    }
  }

  async enterMatchmaking() {
    if (!this.currentMatch) {
      throw new PLLAYError('No active match queue');
    }

    try {
      return await this.matchmakingService.enterMatchmaking(this.currentMatch.id);
    } catch (error) {
      throw new PLLAYError('Failed to enter matchmaking', error);
    }
  }

  onPartyComplete(callback) {
    this.matchmakingService.on('partyComplete', callback);
    return this;
  }

  onMatchStart(callback) {
    this.matchmakingService.on('matchStart', callback);
    return this;
  }

  onMatchEnd(callback) {
    this.matchmakingService.on('matchEnd', callback);
    return this;
  }

  getCurrentMatch() {
    return this.currentMatch;
  }

  isMatchActive() {
    return !!this.currentMatch;
  }
}

module.exports = new PragmaService();