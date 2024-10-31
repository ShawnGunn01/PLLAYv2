const request = require('supertest');
const express = require('express');
const {
  rateLimiter,
  cors,
  securityHeaders,
  xssSanitizer
} = require('../../../src/middleware/security.middleware');

describe('Security Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Rate Limiter', () => {
    beforeEach(() => {
      app.use(rateLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));
    });

    it('should allow requests within limit', async () => {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should block requests over limit', async () => {
      // Make 101 requests
      const requests = Array(101).fill().map(() => 
        request(app).get('/test')
      );

      const responses = await Promise.all(requests);
      const blockedRequests = responses.filter(r => r.status === 429);
      
      expect(blockedRequests.length).toBeGreaterThan(0);
    });
  });

  describe('XSS Protection', () => {
    beforeEach(() => {
      app.use(xssSanitizer);
      app.post('/test', (req, res) => res.json(req.body));
    });

    it('should sanitize XSS in request body', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          text: '<script>alert("xss")</script>Hello'
        });

      expect(response.body.text).not.toContain('<script>');
    });

    it('should handle nested objects', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nested: {
            text: '<script>alert("xss")</script>Hello'
          }
        });

      expect(response.body.nested.text).not.toContain('<script>');
    });
  });

  describe('Security Headers', () => {
    beforeEach(() => {
      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));
    });

    it('should set security headers', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('0');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('CORS', () => {
    beforeEach(() => {
      app.use(cors);
      app.get('/test', (req, res) => res.json({ success: true }));
    });

    it('should handle CORS preflight', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://example.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('should handle CORS actual request', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://example.com');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});