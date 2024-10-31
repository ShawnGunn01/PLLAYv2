const request = require('supertest');
const app = require('../../src/server');
const { expect } = require('chai');

describe('Sweepstakes API Tests', () => {
  let userToken;
  let testUserId;
  let sweepstakesId;

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

  describe('Sweepstakes Creation', () => {
    it('should create a sweepstakes', async () => {
      const response = await request(app)
        .post('/sweepstakes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Sweepstakes',
          description: 'Test Description',
          startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          endDate: new Date(Date.now() + 172800000).toISOString(),  // Day after tomorrow
          prizePool: 1000,
          maxEntries: 100,
          entryRequirements: {
            minLevel: 1,
            kycRequired: true,
            locationRestrictions: ['NK', 'CU']
          },
          drawingRules: {
            numWinners: 3,
            prizeDistribution: {
              1: 0.5,  // 50% for first place
              2: 0.3,  // 30% for second place
              3: 0.2   // 20% for third place
            }
          }
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.sweepstakes).to.have.property('id');
      sweepstakesId = response.body.sweepstakes.id;
    });

    it('should validate sweepstakes dates', async () => {
      const response = await request(app)
        .post('/sweepstakes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Invalid Dates',
          description: 'Test',
          startDate: new Date(Date.now() + 172800000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(), // End before start
          prizePool: 1000,
          maxEntries: 100
        })
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.error).to.match(/end date must be after start date/i);
    });
  });

  describe('Sweepstakes Entry', () => {
    it('should enter sweepstakes', async () => {
      const response = await request(app)
        .post(`/sweepstakes/${sweepstakesId}/enter`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          entries: 2
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.entries).to.be.an('array');
      expect(response.body.entries).to.have.lengthOf(2);
    });

    it('should validate entry limits', async () => {
      const response = await request(app)
        .post(`/sweepstakes/${sweepstakesId}/enter`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          entries: 101 // Over maxEntries
        })
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.error).to.match(/maximum entries limit/i);
    });

    it('should handle mail-in entries', async () => {
      const response = await request(app)
        .post(`/sweepstakes/${sweepstakesId}/mail-entry`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fullName: 'Test User',
          email: 'test@example.com',
          phone: '1234567890',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zip: '12345'
          },
          postmarkDate: new Date().toISOString(),
          receivedDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body).to.have.property('entryNumber');
    });
  });

  describe('Sweepstakes Management', () => {
    it('should get active sweepstakes', async () => {
      const response = await request(app)
        .get('/sweepstakes/active')
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.sweepstakes).to.be.an('array');
    });

    it('should draw winners', async () => {
      const response = await request(app)
        .post(`/sweepstakes/${sweepstakesId}/draw`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.winners).to.be.an('array');
      expect(response.body.winners).to.have.lengthOf(3); // Based on numWinners in creation
    });

    it('should get drawing audit trail', async () => {
      const response = await request(app)
        .get(`/sweepstakes/${sweepstakesId}/audit`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.audit).to.have.property('seed');
      expect(response.body.audit).to.have.property('steps');
    });
  });

  describe('Winner Management', () => {
    it('should notify winners', async () => {
      const response = await request(app)
        .post(`/sweepstakes/${sweepstakesId}/notify-winners`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.notifications).to.be.an('array');
    });

    it('should generate winner affidavits', async () => {
      const response = await request(app)
        .get(`/sweepstakes/${sweepstakesId}/winner-affidavit`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.affidavit).to.have.property('type', 'AFFIDAVIT_OF_ELIGIBILITY');
    });
  });

  describe('Compliance', () => {
    it('should generate compliance report', async () => {
      const response = await request(app)
        .get(`/sweepstakes/${sweepstakesId}/compliance-report`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.report).to.have.property('winners');
      expect(response.body.report).to.have.property('entries');
      expect(response.body.report).to.have.property('tax');
    });

    it('should validate location restrictions', async () => {
      const response = await request(app)
        .post(`/sweepstakes/${sweepstakesId}/validate-location`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ip: '1.1.1.1'
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body).to.have.property('allowed');
      expect(response.body).to.have.property('restrictions');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid sweepstakes ID', async () => {
      await request(app)
        .get('/sweepstakes/invalid-id/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should handle unauthorized access', async () => {
      await request(app)
        .post('/sweepstakes')
        .send({
          name: 'Test Sweepstakes'
        })
        .expect(401);
    });

    it('should handle invalid entry data', async () => {
      await request(app)
        .post(`/sweepstakes/${sweepstakesId}/enter`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          entries: -1
        })
        .expect(400);
    });
  });
});