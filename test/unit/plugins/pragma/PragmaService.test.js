const PragmaService = require('../../../../src/plugins/pragma/PragmaService');
const { PLLAYError } = require('../../../../src/plugins/pllay/errors');

describe('PragmaService', () => {
  beforeEach(() => {
    PragmaService.isInitialized = false;
    PragmaService.currentMatch = null;
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const config = {
        PRAGMA_API_URL: 'http://test.com',
        AUTH_CODE_APPLICATION_ID: 'test-id',
        AUTH_CODE_APPLICATION_SECRET: 'test-secret'
      };

      await expect(PragmaService.initialize(config)).resolves.toBe(true);
      expect(PragmaService.isInitialized).toBe(true);
    });

    it('should not initialize multiple times', async () => {
      PragmaService.isInitialized = true;
      const initSpy = jest.spyOn(PragmaService, 'initializeAuthCodeService');

      await PragmaService.initialize({});
      expect(initSpy).not.toHaveBeenCalled();
    });
  });

  describe('auth code', () => {
    beforeEach(() => {
      PragmaService.isInitialized = true;
      PragmaService.authCodeService = {
        requestAuthCode: jest.fn()
      };
    });

    it('should get auth code successfully', async () => {
      const mockCode = { authCode: 'test-code' };
      PragmaService.authCodeService.requestAuthCode.mockResolvedValueOnce(mockCode);

      const result = await PragmaService.getAuthCode('player123');
      expect(result).toBe(mockCode.authCode);
    });

    it('should throw if not initialized', async () => {
      PragmaService.isInitialized = false;
      await expect(PragmaService.getAuthCode('player123'))
        .rejects.toThrow('Pragma service not initialized');
    });
  });

  describe('matchmaking', () => {
    beforeEach(() => {
      PragmaService.isInitialized = true;
      PragmaService.matchmakingService = {
        queueForMatch: jest.fn(),
        enterMatchmaking: jest.fn(),
        on: jest.fn()
      };
    });

    it('should queue for matchmaking', async () => {
      const mockMatch = { id: 'match-1' };
      PragmaService.matchmakingService.queueForMatch.mockResolvedValueOnce({
        match: mockMatch
      });

      await PragmaService.queueForMatchmaking();
      expect(PragmaService.currentMatch).toEqual(mockMatch);
    });

    it('should enter matchmaking with active match', async () => {
      PragmaService.currentMatch = { id: 'match-1' };
      await PragmaService.enterMatchmaking();
      
      expect(PragmaService.matchmakingService.enterMatchmaking)
        .toHaveBeenCalledWith('match-1');
    });

    it('should throw when entering matchmaking without active match', async () => {
      await expect(PragmaService.enterMatchmaking())
        .rejects.toThrow('No active match queue');
    });
  });
});