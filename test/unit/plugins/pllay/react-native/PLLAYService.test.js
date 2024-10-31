const PLLAYService = require('../../../../../src/plugins/pllay/react-native/PLLAYService');
const { PLLAYError } = require('../../../../../src/plugins/pllay/errors');

describe('PLLAYService', () => {
  let mockNativeModule;
  let mockEventEmitter;

  beforeEach(() => {
    mockNativeModule = {
      initialize: jest.fn(),
      startGame: jest.fn(),
      endGame: jest.fn(),
      endGameEncrypted: jest.fn()
    };

    mockEventEmitter = {
      addListener: jest.fn()
    };

    PLLAYService.nativeModule = mockNativeModule;
    PLLAYService.nativeEventEmitter = mockEventEmitter;
    PLLAYService.isInitialized = false;
    PLLAYService.currentGame = null;
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockNativeModule.initialize.mockResolvedValueOnce({ success: true });

      await expect(PLLAYService.initialize({
        PUBLIC_KEY: 'test-key'
      })).resolves.toBe(true);
      
      expect(PLLAYService.isInitialized).toBe(true);
    });

    it('should setup event listeners', async () => {
      mockNativeModule.initialize.mockResolvedValueOnce({ success: true });
      await PLLAYService.initialize({ PUBLIC_KEY: 'test-key' });

      expect(mockEventEmitter.addListener).toHaveBeenCalledWith(
        'onGameSetStart',
        expect.any(Function)
      );
    });
  });

  describe('game management', () => {
    beforeEach(() => {
      PLLAYService.isInitialized = true;
    });

    it('should start game successfully', async () => {
      const mockSession = {
        roundId: 'round1',
        tournamentId: 'tournament1'
      };

      mockNativeModule.startGame.mockResolvedValueOnce(mockSession);

      const result = await PLLAYService.startGame();
      expect(result).toEqual(mockSession);
      expect(PLLAYService.currentGame).toEqual(mockSession);
    });

    it('should end game successfully', async () => {
      PLLAYService.currentGame = { roundId: 'round1' };
      const score = { points: 100 };

      mockNativeModule.endGame.mockResolvedValueOnce({ success: true });

      await PLLAYService.endGame(score);
      expect(PLLAYService.currentGame).toBeNull();
    });

    it('should handle encrypted game end', async () => {
      PLLAYService.currentGame = { roundId: 'round1' };
      const keyProvider = () => 'test-key';
      const score = { points: 100 };

      mockNativeModule.endGameEncrypted.mockResolvedValueOnce({ success: true });

      await PLLAYService.endGameEncrypted(keyProvider, score);
      expect(mockNativeModule.endGameEncrypted).toHaveBeenCalledWith({
        key: 'test-key',
        score
      });
    });
  });

  describe('event handling', () => {
    it('should handle game set start event', (done) => {
      const mockPayload = {
        setId: 'set1',
        tournamentId: 'tournament1',
        participants: [[{ playerId: 'player1' }]]
      };

      PLLAYService.onGameSetStart((data) => {
        expect(data.setId).toBe(mockPayload.setId);
        expect(data.participants).toBeInstanceOf(Array);
        done();
      });

      // Simulate native event
      mockEventEmitter.addListener.mock.calls[0][1](mockPayload);
    });
  });
});