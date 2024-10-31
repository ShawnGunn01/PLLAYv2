const request = require('supertest');
const app = require('../../../src/server');
const oauthService = require('../../../src/services/oauth.service');

jest.mock('../../../src/services/oauth.service');

describe('OAuth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /oauth/auth-url', () => {
    it('should return auth URL', async () => {
      const mockAuthUrl = 'https://pllay.io/oauth/authorize';
      oauthService.generateAuthUrl.mockReturnValue(mockAuthUrl);

      const response = await request(app)
        .get('/oauth/auth-url')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        authUrl: mockAuthUrl,
        message: expect.any(String)
      });
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array(101).fill().map(() => 
        request(app).get('/oauth/auth-url')
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('GET /oauth/callback', () => {
    it('should handle successful callback', async () => {
      const mockCode = 'test-auth-code';
      const mockUserInfo = { userId: 'user123' };

      oauthService.handleOAuthFlow.mockResolvedValue(mockUserInfo);

      const response = await request(app)
        .get('/oauth/callback')
        .query({ code: mockCode, result: 'success' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Account connected successfully',
        userId: mockUserInfo.userId
      });
    });

    it('should validate required parameters', async () => {
      const response = await request(app)
        .get('/oauth/callback')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle OAuth flow errors', async () => {
      const mockCode = 'invalid-code';
      oauthService.handleOAuthFlow.mockRejectedValue(new Error('Invalid code'));

      const response = await request(app)
        .get('/oauth/callback')
        .query({ code: mockCode, result: 'success' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /oauth/status/:userId', () => {
    it('should return connection status', async () => {
      const mockUserId = 'user123';
      const mockUserInfo = { userId: mockUserId };

      oauthService.getUserInfo.mockResolvedValue(mockUserInfo);

      const response = await request(app)
        .get(`/oauth/status/${mockUserId}`)
        .set('authToken', 'valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        connected: true,
        userId: mockUserId
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/oauth/status/user123')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/authentication required/i);
    });
  });
});