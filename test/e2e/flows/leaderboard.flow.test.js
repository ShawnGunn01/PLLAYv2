const request = require('supertest');
const app = require('../../../src/server');
const { expect } = require('chai');

describe('Leaderboard Flow', () => {
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

  it('should get global leaderboard', async () => {
    const response = await request(app)
      .get('/leaderboard/global')
      .query({
        limit: 10,
        timeframe: 'weekly'
      })
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.leaderboard).to.be.an('array');
  });

  it('should get game leaderboard', async () => {
    const response = await request(app)
      .get('/leaderboard/game/test_game')
      .query({
        limit: 10,
        timeframe: 'daily'
      })
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.leaderboard).to.be.an('array');
  });

  it('should get user rank', async () => {
    const response = await request(app)
      .get('/leaderboard/rank/test_user')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.rank).to.have.property('position');
  });
});