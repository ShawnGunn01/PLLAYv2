const EventEmitter = require('events');
const { PLLAYError } = require('../errors');

class MultiplayerManager extends EventEmitter {
  constructor(service) {
    super();
    this.service = service;
    this.currentMatch = null;
    this.currentSet = null;
    this.playerMetadata = new Map();
    this.setupCallbacks();
  }

  setupCallbacks() {
    if (typeof window === 'undefined' || !window.PLLAY) {
      throw new PLLAYError('PLLAY SDK not available');
    }

    // Game Set Start
    window.PLLAY.registerGameSetStartCallback((payload) => {
      this.currentSet = {
        setId: payload.setId,
        tournamentId: payload.tournamentId,
        matchId: payload.matchId,
        roundId: payload.roundId,
        metadata: payload.globalMetadata,
        endTime: payload.setEndTimeUnix,
        teams: this.normalizeTeams(payload.participants)
      };
      
      this.emit('setStart', this.currentSet);
    });

    // Game Set End
    window.PLLAY.registerGameSetEndCallback(async (payload) => {
      const setData = {
        setId: payload.setId,
        matchId: payload.matchId
      };
      
      this.currentSet = null;
      this.emit('setEnd', setData);
    });

    // Match Start
    window.PLLAY.registerMatchStartCallback((payload) => {
      this.currentMatch = {
        matchId: payload.matchId,
        status: 'active'
      };
      
      this.emit('matchStart', this.currentMatch);
    });

    // Match End
    window.PLLAY.registerMatchEndCallback((payload) => {
      const matchData = {
        matchId: payload.matchId,
        status: 'ended'
      };
      
      this.currentMatch = null;
      this.emit('matchEnd', matchData);
    });
  }

  normalizeTeams(participants) {
    return participants.map(team => ({
      players: team.map(player => ({
        id: player.playerId,
        inGameId: player.ingamePlayerId,
        username: player.username,
        firstName: player.firstName,
        lastName: player.lastName,
        avatar: player.avatar,
        metadata: player.ingameMetadata
      }))
    }));
  }

  async registerInGamePlayerId(playerId, metadata = '') {
    if (!this.service.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }

    if (!playerId || typeof playerId !== 'string') {
      throw new PLLAYError('Invalid player ID');
    }

    try {
      await window.PLLAY.registerInGamePlayerId(playerId, metadata);
      this.playerMetadata.set(playerId, metadata);
      this.emit('playerRegistered', { playerId, metadata });
      return true;
    } catch (error) {
      throw new PLLAYError('Failed to register player ID', error);
    }
  }

  isInMatch() {
    return !!this.currentMatch;
  }

  isInSet() {
    return !!this.currentSet;
  }

  getCurrentMatch() {
    return this.currentMatch;
  }

  getCurrentSet() {
    return this.currentSet;
  }

  getPlayerMetadata(playerId) {
    return this.playerMetadata.get(playerId);
  }
}

module.exports = MultiplayerManager;