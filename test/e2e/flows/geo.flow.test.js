const request = require('supertest');
const app = require('../../../src/server');
const { expect } = require('chai');

describe('Geolocation Flow', () => {
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

  it('should check location', async () => {
    const response = await request(app)
      .post('/geo/check')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ip: '1.1.1.1'
      })
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body).to.have.property('allowed');
    expect(response.body).to.have.property('location');
    expect(response.body).to.have.property('vpn');
  });

  it('should handle restricted locations', async () => {
    const response = await request(app)
      .post('/geo/check')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ip: '2.2.2.2', // IP from restricted state
        gameType: 'CARDS'
      })
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.allowed).to.be.false;
    expect(response.body.restrictions).to.include('STATE_RESTRICTED');
  });
});