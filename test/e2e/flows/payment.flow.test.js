const request = require('supertest');
const app = require('../../../src/server');
const { expect } = require('chai');

describe('Payment Flow', () => {
  let userToken;
  let paymentIntentId;

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

  describe('Credit Card Payment', () => {
    it('should create payment intent', async () => {
      const response = await request(app)
        .post('/payments/intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 1000,
          currency: 'USD'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.intent).to.have.property('clientSecret');
      paymentIntentId = response.body.intent.id;
    });

    it('should process payment', async () => {
      const response = await request(app)
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentIntentId,
          paymentMethodId: 'test_card_success'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.payment.status).to.equal('succeeded');
    });
  });

  describe('Crypto Payment', () => {
    it('should create crypto invoice', async () => {
      const response = await request(app)
        .post('/crypto-payment/invoice')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 5000,
          currency: 'USD',
          description: 'Test payment'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.invoice).to.have.property('paymentRequest');
    });
  });

  it('should get transaction history', async () => {
    const response = await request(app)
      .get('/payments/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.transactions).to.be.an('array');
  });
});