const request = require('supertest');
const app = require('../../../src/server');
const { expect } = require('chai');

describe('Wager Flow', () => {
  let userToken;
  let wagerId;

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

  it('should create wager', async () => {
    const response = await request(app)
      .post('/wager')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        gameId: 'test_game',
        amount: 1000,
        gameData: {
          mode: 'ranked'
        }
      })
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.wager).to.have.property('id');
    wagerId = response.body.wager.id;
  });

  it('should complete wager', async () => {
    const response = await request(app)
      .post(`/wager/${wagerId}/complete`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        won: true,
        actualWin: 2000,
        gameData: {
          score: 100
        }
      })
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.wager.status).to.equal('won');
  });

  it('should get wager history', async () => {
    const response = await request(app)
      .get('/wager/history')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.history).to.be.an('array');
  });

  it('should get wager stats', async () => {
    const response = await request(app)
      .get('/wager/stats')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.stats).to.have.property('totalWagers');
  });
});