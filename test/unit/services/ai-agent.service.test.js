const AIAgentService = require('../../../src/services/ai-agent.service');
const { PLLAYError } = require('../../../src/utils/errors');
const cache = require('../../../src/utils/cache');

jest.mock('../../../src/utils/cache');

describe('AIAgentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMessage', () => {
    it('should process message successfully', async () => {
      const userId = 'test_user';
      const message = 'How do I create a wager?';
      const channel = 'web';

      const response = await AIAgentService.handleMessage(userId, message, channel);
      expect(response).toBeTruthy();
    });

    it('should maintain conversation context', async () => {
      const userId = 'test_user';
      cache.get.mockResolvedValue([
        { role: 'user', content: 'Previous message' }
      ]);

      await AIAgentService.handleMessage(userId, 'New message', 'web');
      
      expect(cache.set).toHaveBeenCalled();
      const savedContext = cache.set.mock.calls[0][1];
      expect(savedContext.length).toBeGreaterThan(1);
    });

    it('should handle function calls', async () => {
      const userId = 'test_user';
      const message = 'Create a wager for $10';

      const response = await AIAgentService.handleMessage(userId, message, 'web');
      expect(response).toContain('wager');
    });
  });

  describe('context management', () => {
    it('should trim context when too long', () => {
      const longContext = Array(20).fill({ role: 'user', content: 'test' });
      const trimmed = AIAgentService.trimContext(longContext);
      expect(trimmed.length).toBe(AIAgentService.maxContextLength);
    });
  });

  describe('response formatting', () => {
    it('should format SMS response within limit', () => {
      const response = { content: 'x'.repeat(200) };
      const formatted = AIAgentService.formatSMSResponse(response);
      expect(formatted.length).toBeLessThanOrEqual(160);
    });

    it('should format web response with markdown', () => {
      const response = { content: '**Bold** text' };
      const formatted = AIAgentService.formatWebResponse(response);
      expect(formatted).toContain('**Bold**');
    });
  });
});