const request = require('supertest');
const app = require('../../../src/server');
const { expect } = require('chai');

describe('Profile Flow', () => {
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

  it('should get user profile', async () => {
    const response = await request(app)
      .get('/profile/test_user')
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.profile).to.have.property('username');
  });

  it('should update profile', async () => {
    const response = await request(app)
      .patch('/profile/test_user')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bio: 'Test bio',
        settings: {
          notifications: true
        }
      })
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.profile.bio).to.equal('Test bio');
  });

  it('should get user stats', async () => {
    const response = await request(app)
      .get('/profile/test_user/stats')
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.stats).to.have.property('totalGames');
  });

  it('should get achievements', async () => {
    const response = await request(app)
      .get('/profile/test_user/achievements')
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.achievements).to.be.an('array');
  });
});