const request = require('supertest');
const app = require('../../src/server');
const { expect } = require('chai');

describe('Admin Dashboard API Tests', () => {
  let adminToken;
  let testUserId;
  let testTournamentId;
  let testVerificationId;

  before(async () => {
    // Get admin auth token
    const authResponse = await request(app)
      .post('/oauth/token')
      .send({
        username: 'admin_user',
        password: 'admin_pass',
        role: 'admin'
      });
    adminToken = authResponse.body.token;
  });

  describe('Dashboard Statistics', () => {
    it('should get dashboard stats', async () => {
      const response = await request(app)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.stats).to.have.property('users');
      expect(response.body.stats).to.have.property('tournaments');
      expect(response.body.stats).to.have.property('payments');
      expect(response.body.stats).to.have.property('kyc');
    });

    it('should get payment analytics', async () => {
      const response = await request(app)
        .get('/admin/dashboard/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.analytics).to.have.property('byType');
      expect(response.body.analytics).to.have.property('dailyVolume');
    });

    it('should get performance metrics', async () => {
      const response = await request(app)
        .get('/admin/dashboard/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ timeframe: '1h' })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.metrics).to.have.property('api');
      expect(response.body.metrics).to.have.property('system');
      expect(response.body.metrics).to.have.property('database');
    });
  });

  describe('User Management', () => {
    it('should suspend user', async () => {
      const response = await request(app)
        .post('/admin/users/test_user_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'suspend',
          reason: 'Suspicious activity'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.user.status).to.equal('suspended');
    });

    it('should update user risk level', async () => {
      const response = await request(app)
        .post('/admin/users/test_user_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'updateRisk',
          riskLevel: 'high',
          reason: 'Multiple suspicious transactions'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.user.risk_level).to.equal('high');
    });

    it('should reinstate user', async () => {
      const response = await request(app)
        .post('/admin/users/test_user_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'reinstate'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.user.status).to.equal('active');
    });
  });

  describe('Tournament Management', () => {
    it('should cancel tournament', async () => {
      const response = await request(app)
        .post('/admin/tournaments/test_tournament_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'cancel',
          reason: 'Technical issues'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.tournament.status).to.equal('cancelled');
    });

    it('should pause tournament', async () => {
      const response = await request(app)
        .post('/admin/tournaments/test_tournament_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'pause'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.tournament.status).to.equal('paused');
    });

    it('should resume tournament', async () => {
      const response = await request(app)
        .post('/admin/tournaments/test_tournament_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'resume'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.tournament.status).to.equal('active');
    });
  });

  describe('KYC Management', () => {
    it('should review KYC verification', async () => {
      const response = await request(app)
        .post('/admin/kyc/test_verification_id/review')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'approved',
          notes: 'All documents verified successfully'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.verification.status).to.equal('approved');
    });

    it('should get pending KYC verifications', async () => {
      const response = await request(app)
        .get('/admin/kyc/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.verifications).to.be.an('array');
    });
  });

  describe('Compliance Reports', () => {
    it('should generate compliance report', async () => {
      const response = await request(app)
        .post('/admin/compliance/report')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.report).to.have.property('kycStats');
      expect(response.body.report).to.have.property('amlStats');
      expect(response.body.report).to.have.property('riskAssessments');
    });

    it('should flag suspicious activity', async () => {
      const response = await request(app)
        .post('/admin/compliance/suspicious-activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'test_user_id',
          type: 'large_transaction',
          severity: 'high',
          details: {
            description: 'Unusual transaction pattern detected',
            evidence: ['transaction_1', 'transaction_2'],
            relatedTransactions: ['tx_1', 'tx_2']
          }
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.activity).to.have.property('status', 'pending');
    });
  });

  describe('System Settings', () => {
    it('should update system settings', async () => {
      const response = await request(app)
        .post('/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          maxWagerAmount: 10000,
          minWagerAmount: 1,
          maxDailyDeposit: 50000,
          maxMonthlyDeposit: 200000
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.settings).to.have.property('maxWagerAmount', 10000);
    });

    it('should get current system settings', async () => {
      const response = await request(app)
        .get('/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.settings).to.be.an('object');
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      await request(app)
        .get('/admin/dashboard')
        .expect(401);
    });

    it('should handle invalid admin token', async () => {
      await request(app)
        .get('/admin/dashboard')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    it('should handle non-admin user', async () => {
      const userResponse = await request(app)
        .post('/oauth/token')
        .send({
          username: 'regular_user',
          password: 'user_pass'
        });

      await request(app)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${userResponse.body.token}`)
        .expect(403);
    });

    it('should handle invalid date ranges', async () => {
      await request(app)
        .post('/admin/compliance/report')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: 'invalid-date',
          endDate: new Date().toISOString()
        })
        .expect(400);
    });
  });
});