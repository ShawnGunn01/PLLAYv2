const PLLAYService = require('../../../../src/plugins/pllay/PLLAYService');
const { PLLAYError } = require('../../../../src/plugins/pllay/errors');

describe('PLLAYService', () => {
  let mockWindow;

  beforeEach(() => {
    mockWindow = {
      PLLAY: {
        invokeManaged: jest.fn(),
        startGame: jest.fn(),
        endGame: jest.fn()
      }
    };
    global.window = mockWindow;
  });

  afterEach(() => {
    PLLAYService.isInitialized = false;
    PLLAYService.currentGame = null;
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully with valid config', async () => {
      mockWindow.PLLAY.invokeManaged.mockResolvedValueOnce(true);

      await expect(PLLAYService.initialize({
        PUBLIC_KEY: 'test-key'
      })).resolves.toBe(true);

      expect(PLLAYService.isInitialized).toBe(true);
    });

    it('should throw PLLAYError when initialization fails', async () => {
      mockWindow.PLLAY.invokeManaged.mockRejectedValueOnce(new Error('API Error'));

      await expect(PLLAYService.initialize({
        PUBLIC_KEY: 'test-key'
      })).rejects.toThrow(PLLAYError);
    });

    it('should not initialize multiple times', async () => {
      mockWindow.PLLAY.invokeManaged.mockResolvedValueOnce(true);
      
      PLLAYService.isInitialized = true;
      await PLLAYService.initialize();
      
      expect(mockWindow.PLLAY.invokeManaged).not.toHaveBeenCalled();
    });
  });

  describe('game management', () => {
    beforeEach(() => {
      PLLAYService.isInitialized = true;
    });

    it('should start game successfully', async () => {
      const mockGameSession = {
        _id: 'game-1',
        status: 'active',
        tournamentId: 'tournament-1',
        playerId: 'player-1'
      };

      mockWindow.PLLAY.startGame.mockResolvedValueOnce(mockGameSession);

      const result = await PLLAYService.startGame();
      expect(result).toEqual({
        status: mockGameSession.status,
        roundId: mockGameSession._id,
        tournamentId: mockGameSession.tournamentId,
        playerId: mockGameSession.playerId
      });
    });

    it('should end game successfully', async () => {
      PLLAYService.currentGame = { id: 'game-1' };
      mockWindow.PLLAY.endGame.mockResolvedValueOnce({ success: true });

      const result = await PLLAYService.endGame(100);
      expect(result).toEqual({ success: true });
      expect(PLLAYService.currentGame).toBeNull();
    });
  });

  describe('event handling', () => {
    it('should handle events correctly', () => {
      const mockCallback = jest.fn();
      PLLAYService.on('test', mockCallback);
      PLLAYService.emit('test', 'data');
      
      expect(mockCallback).toHaveBeenCalledWith('data');
    });

    it('should remove event listeners', () => {
      const mockCallback = jest.fn();
      PLLAYService.on('test', mockCallback);
      PLLAYService.off('test', mockCallback);
      PLLAYService.emit('test', 'data');
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});