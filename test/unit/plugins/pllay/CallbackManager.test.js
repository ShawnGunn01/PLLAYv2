const CallbackManager = require('../../../../src/plugins/pllay/callbacks/CallbackManager');
const { PLLAYError } = require('../../../../src/plugins/pllay/errors');

describe('CallbackManager', () => {
  let mockWindow;
  let callbackManager;
  let mockService;

  beforeEach(() => {
    mockWindow = {
      PLLAY: {
        registerGameSetStartCallback: jest.fn(),
        registerGameSetEndCallback: jest.fn(),
        registerMatchStartCallback: jest.fn(),
        registerMatchEndCallback: jest.fn()
      }
    };
    global.window = mockWindow;

    mockService = {};
    callbackManager = new CallbackManager(mockService);
  });

  describe('initialization', () => {
    it('should register all callbacks on creation', () => {
      expect(mockWindow.PLLAY.registerGameSetStartCallback).toHaveBeenCalled();
      expect(mockWindow.PLLAY.registerGameSetEndCallback).toHaveBeenCalled();
      expect(mockWindow.PLLAY.registerMatchStartCallback).toHaveBeenCalled();
      expect(mockWindow.PLLAY.registerMatchEndCallback).toHaveBeenCalled();
    });

    it('should throw if PLLAY SDK is not available', () => {
      delete global.window.PLLAY;
      expect(() => new CallbackManager(mockService))
        .toThrow('PLLAY SDK not available');
    });
  });

  describe('event handling', () => {
    it('should emit normalized game set start event', (done) => {
      const mockPayload = {
        setId: 'set1',
        tournamentId: 'tournament1',
        matchId: 'match1',
        roundId: 'round1',
        globalMetadata: '{"mode":"ranked"}',
        setEndTimeUnix: Date.now(),
        participants: [[{ playerId: 'player1' }]]
      };

      callbackManager.on('gameSetStart', (payload) => {
        expect(payload.setId).toBe(mockPayload.setId);
        expect(payload.participants).toBeInstanceOf(Array);
        done();
      });

      // Trigger the callback
      mockWindow.PLLAY.registerGameSetStartCallback.mock.calls[0][0](mockPayload);
    });

    it('should emit match end event', (done) => {
      const mockPayload = {
        matchId: 'match1'
      };

      callbackManager.on('matchEnd', (payload) => {
        expect(payload.matchId).toBe(mockPayload.matchId);
        done();
      });

      // Trigger the callback
      mockWindow.PLLAY.registerMatchEndCallback.mock.calls[0][0](mockPayload);
    });
  });

  describe('participant normalization', () => {
    it('should normalize participant data', () => {
      const mockParticipants = [[{
        playerId: 'player1',
        ingamePlayerId: 'game1',
        username: 'User1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'avatar.jpg',
        ingameMetadata: '{"rank":"gold"}'
      }]];

      const normalized = callbackManager.normalizeParticipants(mockParticipants);
      
      expect(normalized[0][0]).toEqual({
        playerId: 'player1',
        ingamePlayerId: 'game1',
        username: 'User1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'avatar.jpg',
        ingameMetadata: '{"rank":"gold"}'
      });
    });
  });
});