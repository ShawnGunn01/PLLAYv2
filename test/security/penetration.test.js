const request = require('supertest');
const app = require('../../src/server');

describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should prevent unauthorized access', async () => {
      await request(app)
        .get('/api/protected-endpoint')
        .expect(401);
    });

    it('should detect invalid tokens', async () => {
      await request(app)
        .get('/api/protected-endpoint')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    it('should prevent brute force attacks', async () => {
      const attempts = Array(10).fill().map(() => 
        request(app)
          .post('/oauth/token')
          .send({ username: 'test', password: 'wrong' })
      );

      const responses = await Promise.all(attempts);
      expect(responses.some(r => r.status === 429)).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should prevent SQL injection', async () => {
      await request(app)
        .get('/api/users')
        .query({ id: "1' OR '1'='1" })
        .expect(400);
    });

    it('should prevent XSS attacks', async () => {
      await request(app)
        .post('/api/messages')
        .send({ content: '<script>alert("xss")</script>' })
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array(101).fill().map(() =>
        request(app).get('/api/public-endpoint')
      );

      const responses = await Promise.all(requests);
      expect(responses.some(r => r.status === 429)).toBe(true);
    });
  });
});