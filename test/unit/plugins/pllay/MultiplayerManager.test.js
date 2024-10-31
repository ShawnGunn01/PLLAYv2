const MultiplayerManager = require('../../../../src/plugins/pllay/multiplayer/MultiplayerManager');
const { PLLAYError } = require('../../../../src/plugins/pllay/errors');

describe('MultiplayerManager', () => {
  let mockService;
  let mockWindow;
  let multiplayerManager;

  beforeEach(() => {
    mockService = {
      isInitialized: true
    };

    mockWindow = {
      PLLAY: {
        registerGameSetStartCallback: jest.fn(),
        registerGameSetEndCallback: jest.fn(),
        registerMatchStartCallback: jest.fn(),
        registerMatchEndCallback: jest.fn(),
        registerInGamePlayerId: jest.fn()
      }
    };

    global.window = mockWindow;
    multiplayerManager = new MultiplayerManager(mockService);
  });

  describe('callback registration', () => {
    it('should register all callbacks on initialization', () => {
      expect(mockWindow.PLLAY.registerGameSetStartCallback).toHaveBeenCalled();
      expect(mockWindow.PLLAY.registerGameSetEndCallback).toHaveBeenCalled();
      expect(mockWindow.PLLAY.registerMatchStartCallback).toHaveBeenCalled();
      expect(mockWindow.PLLAY.registerMatchEndCallback).toHaveBeenCalled();
    });

    it('should handle set start callback correctly', () => {
      const spy = jest.fn();
      multiplayerManager.on('setStart', spy);

      const mockPayload = {
        setId: 'set123',
        tournamentId: 'tournament123',
        matchId: 'match123',
        roundId: 'round123',
        globalMetadata: '{"gameMode":"ranked"}',
        setEndTimeUnix: Date.now() + 300000,
        participants: [
          [{ playerId: 'player1', username: 'User1' }],
          [{ playerId: 'player2', username: 'User2' }]
        ]
      };

      // Simulate callback
      mockWindow.PLLAY.registerGameSetStartCallback.mock.calls[0][0](mockPayload);

      expect(spy).toHaveBeenCalled();
      expect(multiplayerManager.getCurrentSet()).toBeTruthy();
    });

    it('should handle match end callback correctly', () => {
      const spy = jest.fn();
      multiplayerManager.on('matchEnd', spy);

      const mockPayload = {
        matchId: 'match123'
      };

      // Set current match
      multiplayerManager.currentMatch = { matchId: 'match123' };

      // Simulate callback
      mockWindow.PLLAY.registerMatchEndCallback.mock.calls[0][0](mockPayload);

      expect(spy).toHaveBeenCalled();
      expect(multiplayerManager.getCurrentMatch()).toBeNull();
    });
  });

  describe('team normalization', () => {
    it('should normalize team data correctly', () => {
      const mockTeams = [
        [{
          playerId: 'player1',
          ingamePlayerId: 'game1',
          username: 'User1',
          ingameMetadata: '{"rank":"gold"}'
        }]
      ];

      const normalized = multiplayerManager.normalizeTeams(mockTeams);
      
      expect(normalized[0].players[0]).toEqual(
        expect.objectContaining({
          id: 'player1',
          inGameId: 'game1',
          username: 'User1',
          metadata: '{"rank":"gold"}'
        })
      );
    });
  });
});