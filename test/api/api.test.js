const request = require('supertest');
const app = require('../../src/server');
const { expect } = require('chai');

describe('API Tests', () => {
  let userToken;
  let testUserId;

  before(async () => {
    // Get auth token
    const authResponse = await request(app)
      .post('/oauth/token')
      .send({
        username: 'test_user',
        password: 'test_pass'
      });
    userToken = authResponse.body.token;
    testUserId = authResponse.body.userId;
  });

  describe('Authentication', () => {
    it('should get OAuth URL', async () => {
      const response = await request(app)
        .get('/oauth/auth-url')
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.authUrl).to.be.a('string');
    });

    it('should handle invalid tokens', async () => {
      await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });

  describe('Game Sessions', () => {
    let gameSessionId;

    it('should start a game session', async () => {
      const response = await request(app)
        .post('/game-session/start')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.session).to.have.property('id');
      gameSessionId = response.body.session.id;
    });

    it('should end a game session', async () => {
      const response = await request(app)
        .post('/game-session/end')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: gameSessionId,
          score: 100
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.result).to.have.property('status', 'completed');
    });
  });

  describe('Wagers', () => {
    let wagerId;

    it('should create a wager', async () => {
      const response = await request(app)
        .post('/wager')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          gameId: 'test_game',
          amount: 1000,
          gameData: { mode: 'ranked' }
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.wager).to.have.property('id');
      wagerId = response.body.wager.id;
    });

    it('should complete a wager', async () => {
      const response = await request(app)
        .post(`/wager/${wagerId}/complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          won: true,
          actualWin: 2000,
          gameData: { score: 100 }
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
  });

  describe('Tournaments', () => {
    let tournamentId = 'test_tournament';

    it('should subscribe to tournament', async () => {
      const response = await request(app)
        .post('/tournament/subscribe')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tournamentId
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body).to.have.property('subscriptionId');
    });

    it('should get tournament status', async () => {
      const response = await request(app)
        .get(`/tournament/${tournamentId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body).to.have.property('status');
    });
  });

  describe('Profile & Stats', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get(`/profile/${testUserId}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.profile).to.have.property('username');
    });

    it('should update user profile', async () => {
      const response = await request(app)
        .patch(`/profile/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bio: 'Test bio',
          settings: { notifications: true }
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.profile.bio).to.equal('Test bio');
    });

    it('should get user stats', async () => {
      const response = await request(app)
        .get(`/profile/${testUserId}/stats`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.stats).to.have.property('totalGames');
    });
  });

  describe('Leaderboard', () => {
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

    it('should get game-specific leaderboard', async () => {
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
  });

  describe('Wallet & Payments', () => {
    it('should get wallet info', async () => {
      const response = await request(app)
        .get('/wallet')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.wallet).to.have.property('balance');
    });

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
    });

    it('should get transaction history', async () => {
      const response = await request(app)
        .get('/wallet/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.transactions).to.be.an('array');
    });
  });

  describe('Security', () => {
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
        .send({ token: '123456' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.verified).to.be.true;
    });
  });

  describe('Geolocation', () => {
    it('should check location', async () => {
      const response = await request(app)
        .post('/geo/check')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ip: '1.1.1.1',
          gameType: 'SKILL_BASED'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body).to.have.property('allowed');
      expect(response.body).to.have.property('location');
    });
  });

  describe('AI Agent', () => {
    it('should handle chat message', async () => {
      const response = await request(app)
        .post('/ai-agent/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'Show my wager status'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.response).to.be.a('string');
    });
  });
});