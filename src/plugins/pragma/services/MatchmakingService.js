const EventEmitter = require('events');
const fetch = require('node-fetch');
const { PLLAYError } = require('../../pllay/errors');

class MatchmakingService extends EventEmitter {
  constructor(config) {
    super();
    this.baseUrl = config.PRAGMA_API_URL;
    this.gameId = config.GAME_ID;
    this.secretKey = config.GAME_SECRET_KEY;
    this.setupWebSocket();
  }

  async queueForMatch() {
    const response = await fetch(`${this.baseUrl}/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`
      },
      body: JSON.stringify({
        requestId: Date.now(),
        type: 'ExternalMatchmakingRpc.QueueForMatchmakingV1Request',
        payload: {}
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new PLLAYError(data.error?.message || 'Failed to queue for match');
    }

    return data.response.payload;
  }

  async enterMatchmaking(matchId) {
    const response = await fetch(`${this.baseUrl}/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`
      },
      body: JSON.stringify({
        requestId: Date.now(),
        type: 'MatchmakingRpc.EnterMatchmakingV1Request',
        payload: {
          matchId
        }
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new PLLAYError(data.error?.message || 'Failed to enter matchmaking');
    }

    return data.response.payload;
  }

  setupWebSocket() {
    // Setup WebSocket connection for real-time notifications
    const ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/v1/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'PartyIsCompleteForMatchmakingV1Notification':
          this.emit('partyComplete', data.payload);
          break;
        case 'MatchStartV1Notification':
          this.emit('matchStart', data.payload);
          break;
        case 'MatchEndV4Notification':
          this.emit('matchEnd', data.payload);
          break;
      }
    };

    ws.onerror = (error) => {
      this.emit('error', new PLLAYError('WebSocket error', error));
    };
  }
}

module.exports = MatchmakingService;