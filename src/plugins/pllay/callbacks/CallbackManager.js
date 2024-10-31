const EventEmitter = require('events');
const { PLLAYError } = require('../errors');

class CallbackManager extends EventEmitter {
  constructor(service) {
    super();
    this.service = service;
    this.callbacks = new Map();
    this.setupCallbacks();
  }

  setupCallbacks() {
    if (typeof window === 'undefined' || !window.PLLAY) {
      throw new PLLAYError('PLLAY SDK not available');
    }

    this.registerGameSetStart();
    this.registerGameSetEnd();
    this.registerMatchStart();
    this.registerMatchEnd();
  }

  registerGameSetStart() {
    window.PLLAY.registerGameSetStartCallback((payload) => {
      const normalizedPayload = {
        setId: payload.setId,
        tournamentId: payload.tournamentId,
        matchId: payload.matchId,
        roundId: payload.roundId,
        globalMetadata: payload.globalMetadata,
        setEndTimeUnix: payload.setEndTimeUnix,
        participants: this.normalizeParticipants(payload.participants)
      };

      this.emit('gameSetStart', normalizedPayload);
    });
  }

  registerGameSetEnd() {
    window.PLLAY.registerGameSetEndCallback((payload) => {
      const normalizedPayload = {
        setId: payload.setId,
        matchId: payload.matchId
      };

      this.emit('gameSetEnd', normalizedPayload);
    });
  }

  registerMatchStart() {
    window.PLLAY.registerMatchStartCallback((payload) => {
      const normalizedPayload = {
        matchId: payload.matchId
      };

      this.emit('matchStart', normalizedPayload);
    });
  }

  registerMatchEnd() {
    window.PLLAY.registerMatchEndCallback((payload) => {
      const normalizedPayload = {
        matchId: payload.matchId
      };

      this.emit('matchEnd', normalizedPayload);
    });
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
}

module.exports = CallbackManager;