const request = require('supertest');
const app = require('../../../src/server');
const { expect } = require('chai');

describe('Security Flow', () => {
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

  describe('2FA', () => {
    it('should setup 2FA', async () => {
      const response = await request(app)
        .post('/security/2fa/setup')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body).to.have.property('secret');
      expect(response.body).to.have.property('qrCode');
    });

    it('should verify 2FA', async () => {
      const response = await request(app)
        .post('/security/2fa/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          token: '123456'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.verified).to.be.true;
    });
  });

  describe('Transaction Monitoring', () => {
    it('should monitor transaction', async () => {
      const response = await request(app)
        .post('/security/monitor/transaction')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 1000,
          type: 'deposit',
          paymentMethod: 'card'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body).to.have.property('allowed');
    });
  });
});