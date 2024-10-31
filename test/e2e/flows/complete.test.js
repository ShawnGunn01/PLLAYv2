const request = require('supertest');
const app = require('../../../src/server');
const { expect } = require('chai');
const { createTestUser, createTestWallet } = require('../utils/test-data');

describe('Complete End-to-End Flow', () => {
  let userToken;
  let userId;
  let wagerId;

  before(async () => {
    // Create test user and wallet
    const user = await createTestUser();
    userId = user.id;
    await createTestWallet(userId);

    // Get auth token
    const authResponse = await request(app)
      .post('/oauth/token')
      .send({
        username: 'test_user',
        password: 'test_pass'
      });
    userToken = authResponse.body.token;
  });

  describe('1. Authentication & KYC', () => {
    it('should complete KYC verification', async () => {
      // Get link token
      const linkResponse = await request(app)
        .post('/kyc/link-token')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(linkResponse.body.linkToken).to.be.a('string');

      // Verify identity
      const verifyResponse = await request(app)
        .post('/kyc/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ publicToken: 'test_success_token' })
        .expect(200);

      expect(verifyResponse.body.verification.status).to.equal('completed');
    });
  });

  describe('2. Payment Processing', () => {
    it('should process payment successfully', async () => {
      // Create payment intent
      const intentResponse = await request(app)
        .post('/payments/intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 1000,
          currency: 'USD'
        })
        .expect(200);

      expect(intentResponse.body.intent.clientSecret).to.be.a('string');

      // Process payment
      const paymentResponse = await request(app)
        .post('/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentIntentId: intentResponse.body.intent.id,
          paymentMethodId: 'test_card_success'
        })
        .expect(200);

      expect(paymentResponse.body.payment.status).to.equal('succeeded');
    });
  });

  describe('3. Geolocation Check', () => {
    it('should validate location', async () => {
      const response = await request(app)
        .post('/geo/check')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ip: '1.1.1.1',
          gameType: 'SKILL_BASED'
        })
        .expect(200);

      expect(response.body.allowed).to.be.true;
      expect(response.body.location).to.exist;
      expect(response.body.vpn.isVPN).to.be.false;
    });
  });

  describe('4. Wager Flow', () => {
    it('should create and complete wager', async () => {
      // Create wager
      const createResponse = await request(app)
        .post('/wager')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          gameId: 'test_game',
          amount: 1000,
          gameData: { mode: 'ranked' }
        })
        .expect(200);

      wagerId = createResponse.body.wager.id;
      expect(wagerId).to.be.a('string');

      // Complete wager
      const completeResponse = await request(app)
        .post(`/wager/${wagerId}/complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          won: true,
          actualWin: 2000,
          gameData: { score: 100 }
        })
        .expect(200);

      expect(completeResponse.body.wager.status).to.equal('won');
    });
  });

  describe('5. Profile & Stats', () => {
    it('should update and retrieve profile', async () => {
      // Update profile
      await request(app)
        .patch(`/profile/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bio: 'Test player',
          settings: { notifications: true }
        })
        .expect(200);

      // Get profile
      const profileResponse = await request(app)
        .get(`/profile/${userId}`)
        .expect(200);

      expect(profileResponse.body.profile.bio).to.equal('Test player');

      // Get stats
      const statsResponse = await request(app)
        .get(`/profile/${userId}/stats`)
        .expect(200);

      expect(statsResponse.body.stats.totalGames).to.be.a('number');
    });
  });

  describe('6. Leaderboard', () => {
    it('should get leaderboard data', async () => {
      const response = await request(app)
        .get('/leaderboard/global')
        .query({
          limit: 10,
          timeframe: 'weekly'
        })
        .expect(200);

      expect(response.body.leaderboard).to.be.an('array');
    });
  });

  describe('7. AI Agent', () => {
    it('should handle chat interaction', async () => {
      const response = await request(app)
        .post('/ai-agent/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'Show my wager status'
        })
        .expect(200);

      expect(response.body.response).to.include('wager');
      expect(response.body.response).to.include('status');
    });
  });

  describe('8. Security', () => {
    it('should setup and verify 2FA', async () => {
      // Setup 2FA
      const setupResponse = await request(app)
        .post('/security/2fa/setup')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(setupResponse.body.secret).to.be.a('string');

      // Verify 2FA
      const verifyResponse = await request(app)
        .post('/security/2fa/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ token: '123456' })
        .expect(200);

      expect(verifyResponse.body.verified).to.be.true;
    });
  });
});