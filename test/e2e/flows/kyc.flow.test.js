const request = require('supertest');
const app = require('../../../src/server');
const { expect } = require('chai');

describe('KYC Flow', () => {
  let userToken;
  let verificationId;

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

  it('should create link token', async () => {
    const response = await request(app)
      .post('/kyc/link-token')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.linkToken).to.be.a('string');
  });

  it('should verify identity', async () => {
    const response = await request(app)
      .post('/kyc/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        publicToken: 'test_public_token'
      })
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.verification).to.have.property('verificationId');
    verificationId = response.body.verification.verificationId;
  });

  it('should get verification status', async () => {
    const response = await request(app)
      .get(`/kyc/status/${verificationId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.status).to.have.property('steps');
  });
});