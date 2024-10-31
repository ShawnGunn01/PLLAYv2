const request = require('supertest');
const app = require('../../../src/server');
const { expect } = require('chai');

describe('Authentication Flow', () => {
  let userToken;

  it('should get OAuth URL', async () => {
    const response = await request(app)
      .get('/oauth/auth-url')
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.authUrl).to.be.a('string');
  });

  it('should handle OAuth callback', async () => {
    const response = await request(app)
      .get('/oauth/callback')
      .query({
        code: 'test_auth_code',
        result: 'success'
      })
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.userId).to.be.a('string');
    userToken = response.body.token;
  });

  it('should verify connection status', async () => {
    const response = await request(app)
      .get('/oauth/status/test_user')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.connected).to.be.true;
  });
});