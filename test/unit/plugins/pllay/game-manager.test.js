const GameManager = require('../../../../src/plugins/pllay/game-manager');
const { PLLAYError } = require('../../../../src/plugins/pllay/errors');

describe('GameManager', () => {
  let mockService;
  let gameManager;

  beforeEach(() => {
    mockService = {
      isInitialized: true,
      startGame: jest.fn(),
      endGame: jest.fn()
    };
    gameManager = new GameManager(mockService);
    gameManager.setScoreTypes(['points', 'points_extra']);
  });

  describe('startGame', () => {
    it('should start game successfully', async () => {
      const mockSession = { id: 'game-1' };
      mockService.startGame.mockResolvedValueOnce(mockSession);

      const result = await gameManager.startGame();
      expect(result).toBe(mockSession);
      expect(gameManager.currentGame).toBe(mockSession);
    });

    it('should throw if service not initialized', async () => {
      mockService.isInitialized = false;
      await expect(gameManager.startGame())
        .rejects
        .toThrow('PLLAY service not initialized');
    });
  });

  describe('endGame', () => {
    beforeEach(() => {
      gameManager.currentGame = { id: 'game-1' };
    });

    it('should end game with valid score', async () => {
      const score = { points: 150.0, points_extra: 2.0 };
      mockService.endGame.mockResolvedValueOnce({ success: true });

      const result = await gameManager.endGame(score);
      expect(result).toEqual({ success: true });
      expect(gameManager.currentGame).toBeNull();
    });

    it('should throw if no active game', async () => {
      gameManager.currentGame = null;
      await expect(gameManager.endGame({ points: 100 }))
        .rejects
        .toThrow('No active game session');
    });

    it('should validate score types', async () => {
      await expect(gameManager.endGame({ invalid_type: 100 }))
        .rejects
        .toThrow('Invalid score type: invalid_type');
    });
  });

  describe('endGameEncrypted', () => {
    beforeEach(() => {
      gameManager.currentGame = { id: 'game-1' };
    });

    it('should encrypt and end game', async () => {
      const keyProvider = () => 'secret-key';
      const score = { points: 150.0, points_extra: 2.0 };
      mockService.endGame.mockResolvedValueOnce({ success: true });

      const result = await gameManager.endGameEncrypted(keyProvider, score);
      expect(result.success).toBe(true);
      expect(mockService.endGame).toHaveBeenCalledWith(
        expect.objectContaining({
          encrypted: true,
          data: expect.any(String),
          iv: expect.any(String),
          salt: expect.any(String),
          authTag: expect.any(String)
        })
      );
    });

    it('should throw if key provider is not a function', async () => {
      await expect(gameManager.endGameEncrypted('not-a-function', {}))
        .rejects
        .toThrow('Key provider must be a function');
    });
  });
});