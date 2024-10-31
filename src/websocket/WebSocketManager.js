const WebSocket = require('ws');
const logger = require('../utils/logger');
const { PLLAYError } = require('../utils/errors');

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.heartbeatInterval = 30000; // 30 seconds
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, req) => {
      const clientId = req.headers['sec-websocket-key'];
      this.clients.set(clientId, {
        ws,
        isAlive: true,
        userId: null,
        gameId: null
      });

      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.isAlive = true;
        }
      });

      ws.on('message', (message) => this.handleMessage(clientId, message));

      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info('Client disconnected', { clientId });
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', { clientId, error });
        ws.close();
      });
    });

    // Start heartbeat
    this.startHeartbeat();
  }

  startHeartbeat() {
    setInterval(() => {
      this.clients.forEach((client, id) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(id);
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, this.heartbeatInterval);
  }

  async handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'auth':
          await this.handleAuth(clientId, data.payload);
          break;
        case 'join_game':
          await this.handleJoinGame(clientId, data.payload);
          break;
        case 'game_update':
          await this.handleGameUpdate(clientId, data.payload);
          break;
        default:
          throw new PLLAYError('Unknown message type');
      }
    } catch (error) {
      this.sendError(client.ws, error);
    }
  }

  async handleAuth(clientId, { userId, token }) {
    // Validate token and authenticate user
    const client = this.clients.get(clientId);
    if (!client) return;

    client.userId = userId;
    this.sendToClient(client.ws, {
      type: 'auth_success',
      payload: { userId }
    });
  }

  async handleJoinGame(clientId, { gameId }) {
    const client = this.clients.get(clientId);
    if (!client || !client.userId) return;

    client.gameId = gameId;
    this.sendToClient(client.ws, {
      type: 'game_joined',
      payload: { gameId }
    });
  }

  async handleGameUpdate(clientId, update) {
    const client = this.clients.get(clientId);
    if (!client || !client.gameId) return;

    // Broadcast update to all clients in the same game
    this.broadcastToGame(client.gameId, {
      type: 'game_update',
      payload: update
    }, clientId);
  }

  broadcastToGame(gameId, message, excludeClientId = null) {
    this.clients.forEach((client, id) => {
      if (client.gameId === gameId && id !== excludeClientId) {
        this.sendToClient(client.ws, message);
      }
    });
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, error) {
    this.sendToClient(ws, {
      type: 'error',
      payload: {
        message: error.message
      }
    });
  }

  close() {
    if (this.wss) {
      this.wss.close();
    }
  }
}

module.exports = new WebSocketManager();