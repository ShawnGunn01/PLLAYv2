const PLLAYAndroidService = require('../../../../src/plugins/pllay/android/PLLAYAndroidService');
const { PLLAYError } = require('../../../../src/plugins/pllay/errors');

describe('PLLAYAndroidService', () => {
  let mockAndroid;

  beforeEach(() => {
    mockAndroid = {
      postMessage: jest.fn(),
      registerCallback: jest.fn()
    };
    global.window = {
      PLLAYAndroid: mockAndroid
    };
    PLLAYAndroidService.isInitialized = false;
    PLLAYAndroidService.currentGame = null;
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockPostMessageResponse({ success: true });

      await expect(PLLAYAndroidService.initialize({
        PUBLIC_KEY: 'test-key'
      })).resolves.toEqual({ success: true });
      
      expect(PLLAYAndroidService.isInitialized).toBe(true);
    });

    it('should throw if SDK not available', async () => {
      delete global.window.PLLAYAndroid;

      await expect(PLLAYAndroidService.initialize({}))
        .rejects.toThrow('PLLAY Android SDK not available');
    });
  });

  describe('game management', () => {
    beforeEach(() => {
      PLLAYAndroidService.isInitialized = true;
    });

    it('should start game successfully', async () => {
      const mockResponse = {
        roundId: 'round1',
        tournamentId: 'tournament1',
        status: 'active',
        playerId: 'player1'
      };

      mockPostMessageResponse(mockResponse);

      const result = await PLLAYAndroidService.startGame();
      expect(result).toEqual(mockResponse);
      expect(PLLAYAndroidService.currentGame).toEqual(mockResponse);
    });

    it('should end game successfully', async () => {
      PLLAYAndroidService.currentGame = { roundId: 'round1' };
      const score = { points: 100 };

      mockPostMessageResponse({ success: true });

      await PLLAYAndroidService.endGame(score);
      expect(PLLAYAndroidService.currentGame).toBeNull();
    });

    it('should update game progress', async () => {
      PLLAYAndroidService.currentGame = { roundId: 'round1' };
      const score = { points: 50 };

      mockPostMessageResponse({ success: true });

      await expect(PLLAYAndroidService.progressGame(score))
        .resolves.toEqual({ success: true });
    });
  });

  describe('multiplayer callbacks', () => {
    it('should handle game set start callback', (done) => {
      const mockPayload = {
        setId: 'set1',
        tournamentId: 'tournament1',
        matchId: 'match1',
        participants: [[{ playerId: 'player1' }]]
      };

      PLLAYAndroidService.onGameSetStart((data) => {
        expect(data.setId).toBe(mockPayload.setId);
        expect(data.participants).toBeInstanceOf(Array);
        done();
      });

      // Simulate native callback
      mockAndroid.registerCallback.mock.calls[0][1](mockPayload);
    });
  });
});

function mockPostMessageResponse(result) {
  mockAndroid.postMessage.mockImplementation((messageString) => {
    const message = JSON.parse(messageString);
    setTimeout(() => {
      window[`pllay_callback_${message.callId}`]({ result });
    }, 0);
  });
}