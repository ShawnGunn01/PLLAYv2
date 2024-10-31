const request = require('supertest');
const app = require('../../../src/server');
const { expect } = require('chai');

describe('AI Agent Routes', () => {
  let userToken;

  before(async () => {
    // Get auth token
    const authResponse = await request(app)
      .post('/oauth/token')
      .send({
        username: 'test_user',
        password: 'test_pass'
      });
    userToken = authResponse.body.token;
  });

  describe('Web Chat', () => {
    it('should handle chat message', async () => {
      const response = await request(app)
        .post('/ai-agent/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'How do I create a wager?'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.response).to.be.a('string');
    });

    it('should enforce rate limits', async () => {
      const requests = Array(25).fill().map(() =>
        request(app)
          .post('/ai-agent/chat')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ message: 'test' })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).to.be.true;
    });
  });

  describe('SMS Webhook', () => {
    it('should handle SMS message', async () => {
      const response = await request(app)
        .post('/ai-agent/sms/webhook')
        .send({
          from: '+1234567890',
          message: 'Check my wager status',
          userId: 'test_user'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.response).to.have.property('message');
      expect(response.body.response.message.length).to.be.lessThanOrEqual(160);
    });
  });

  describe('iMessage Webhook', () => {
    it('should handle iMessage', async () => {
      const response = await request(app)
        .post('/ai-agent/imessage/webhook')
        .send({
          from: 'user@icloud.com',
          message: 'Show my balance',
          userId: 'test_user'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.response).to.have.property('message');
    });
  });
});