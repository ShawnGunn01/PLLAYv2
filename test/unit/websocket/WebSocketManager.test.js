const WebSocket = require('ws');
const WebSocketManager = require('../../../src/websocket/WebSocketManager');

describe('WebSocketManager', () => {
  let mockServer;
  let mockWs;
  let mockReq;

  beforeEach(() => {
    mockWs = {
      on: jest.fn(),
      send: jest.fn(),
      ping: jest.fn(),
      close: jest.fn(),
      terminate: jest.fn(),
      readyState: WebSocket.OPEN
    };

    mockReq = {
      headers: {
        'sec-websocket-key': 'test-client-id'
      }
    };

    mockServer = {
      on: jest.fn()
    };

    WebSocket.Server = jest.fn().mockImplementation(() => mockServer);
  });

  describe('initialization', () => {
    it('should initialize WebSocket server', () => {
      WebSocketManager.initialize({});
      expect(WebSocket.Server).toHaveBeenCalled();
    });

    it('should handle new connections', () => {
      WebSocketManager.initialize({});
      const connectionHandler = mockServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];

      connectionHandler(mockWs, mockReq);
      expect(WebSocketManager.clients.size).toBe(1);
    });
  });

  describe('message handling', () => {
    beforeEach(() => {
      WebSocketManager.initialize({});
      const connectionHandler = mockServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      connectionHandler(mockWs, mockReq);
    });

    it('should handle auth message', async () => {
      const message = {
        type: 'auth',
        payload: {
          userId: 'user123',
          token: 'test-token'
        }
      };

      await WebSocketManager.handleMessage('test-client-id', JSON.stringify(message));
      
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('auth_success')
      );
    });

    it('should handle join game message', async () => {
      const message = {
        type: 'join_game',
        payload: {
          gameId: 'game123'
        }
      };

      // Set userId first
      const client = WebSocketManager.clients.get('test-client-id');
      client.userId = 'user123';

      await WebSocketManager.handleMessage('test-client-id', JSON.stringify(message));
      
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('game_joined')
      );
    });

    it('should handle game updates', async () => {
      const message = {
        type: 'game_update',
        payload: {
          score: 100
        }
      };

      // Set up client
      const client = WebSocketManager.clients.get('test-client-id');
      client.userId = 'user123';
      client.gameId = 'game123';

      await WebSocketManager.handleMessage('test-client-id', JSON.stringify(message));
      
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('game_update')
      );
    });
  });

  describe('heartbeat', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should terminate inactive connections', () => {
      WebSocketManager.initialize({});
      const connectionHandler = mockServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      connectionHandler(mockWs, mockReq);

      const client = WebSocketManager.clients.get('test-client-id');
      client.isAlive = false;

      jest.advanceTimersByTime(30000);

      expect(mockWs.terminate).toHaveBeenCalled();
      expect(WebSocketManager.clients.size).toBe(0);
    });
  });
});