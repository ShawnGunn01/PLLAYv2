const PLLAYiOSService = require('../../../../src/plugins/pllay/ios/PLLAYiOSService');
const { PLLAYError } = require('../../../../src/plugins/pllay/errors');

describe('PLLAYiOSService', () => {
  let mockWebKit;

  beforeEach(() => {
    mockWebKit = {
      messageHandlers: {
        PLLAYService: {
          postMessage: jest.fn()
        }
      }
    };
    global.window = {
      webkit: mockWebKit
    };
    PLLAYiOSService.isInitialized = false;
    PLLAYiOSService.currentGame = null;
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const config = { PUBLIC_KEY: 'test-key' };
      
      mockPostMessageResponse({ success: true });

      await expect(PLLAYiOSService.initialize(config))
        .resolves.toEqual({ success: true });
      
      expect(PLLAYiOSService.isInitialized).toBe(true);
    });

    it('should throw if SDK not available', async () => {
      delete global.window.webkit;

      await expect(PLLAYiOSService.initialize({}))
        .rejects.toThrow('PLLAY iOS SDK not available');
    });
  });

  describe('game management', () => {
    beforeEach(() => {
      PLLAYiOSService.isInitialized = true;
    });

    it('should start game successfully', async () => {
      const mockResponse = {
        roundId: 'round1',
        tournamentId: 'tournament1',
        status: 'active',
        playerId: 'player1'
      };

      mockPostMessageResponse(mockResponse);

      const result = await PLLAYiOSService.startGame();
      expect(result).toEqual(mockResponse);
      expect(PLLAYiOSService.currentGame).toEqual(mockResponse);
    });

    it('should end game successfully', async () => {
      PLLAYiOSService.currentGame = { roundId: 'round1' };
      const score = { points: 100 };

      mockPostMessageResponse({ success: true });

      await PLLAYiOSService.endGame(score);
      expect(PLLAYiOSService.currentGame).toBeNull();
    });

    it('should update game progress', async () => {
      PLLAYiOSService.currentGame = { roundId: 'round1' };
      const score = { points: 50 };

      mockPostMessageResponse({ success: true });

      await expect(PLLAYiOSService.progressGame(score))
        .resolves.toEqual({ success: true });
    });
  });

  describe('button management', () => {
    it('should set button visibility', async () => {
      mockPostMessageResponse({ success: true });

      await PLLAYiOSService.setButtonVisibility(false);
      
      expect(mockWebKit.messageHandlers.PLLAYService.postMessage)
        .toHaveBeenCalledWith(expect.objectContaining({
          method: 'setButtonVisibility',
          params: { visible: false }
        }));
    });

    it('should set button position', async () => {
      mockPostMessageResponse({ success: true });

      await PLLAYiOSService.setButtonPosition(100, 200);
      
      expect(mockWebKit.messageHandlers.PLLAYService.postMessage)
        .toHaveBeenCalledWith(expect.objectContaining({
          method: 'setButtonDefaultPositionAbsolute',
          params: { x: 100, y: 200 }
        }));
    });
  });
});

function mockPostMessageResponse(result) {
  mockWebKit.messageHandlers.PLLAYService.postMessage.mockImplementation(
    ({ callId }) => {
      setTimeout(() => {
        window[`pllay_callback_${callId}`]({ result });
      }, 0);
    }
  );
}