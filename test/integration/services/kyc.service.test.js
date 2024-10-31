const request = require('supertest');
const app = require('../../../src/server');
const kycService = require('../../../src/services/kyc.service');
const { PLLAYError } = require('../../../src/utils/errors');

describe('KYC Integration', () => {
  let testUser;

  beforeAll(async () => {
    testUser = await createTestUser();
  });

  describe('Identity Verification', () => {
    it('should complete successful identity verification', async () => {
      const linkToken = await kycService.createLinkToken(testUser.id);
      expect(linkToken).toBeTruthy();

      const verification = await kycService.verifyIdentity(
        testUser.id,
        'test_success_token'
      );

      expect(verification.status).toBe('completed');
      expect(verification.identity).toBeDefined();

      // Verify user status updated
      const updatedUser = await getUserById(testUser.id);
      expect(updatedUser.kyc_verified).toBe(true);
    });

    it('should handle failed identity verification', async () => {
      await expect(
        kycService.verifyIdentity(testUser.id, 'test_failure_token')
      ).rejects.toThrow(PLLAYError);

      // Verify user status unchanged
      const updatedUser = await getUserById(testUser.id);
      expect(updatedUser.kyc_verified).toBe(false);
    });
  });

  describe('Document Verification', () => {
    it('should process valid documents', async () => {
      const result = await kycService.verifyDocuments(testUser.id, {
        documentType: 'DRIVERS_LICENSE',
        frontImage: 'test_front_image',
        backImage: 'test_back_image'
      });

      expect(result.status).toBe('completed');
    });

    it('should reject invalid documents', async () => {
      await expect(
        kycService.verifyDocuments(testUser.id, {
          documentType: 'DRIVERS_LICENSE',
          frontImage: 'test_invalid_image',
          backImage: 'test_invalid_image'
        })
      ).rejects.toThrow(PLLAYError);
    });
  });

  describe('Webhooks', () => {
    it('should handle verification completion webhook', async () => {
      await request(app)
        .post('/webhooks/plaid')
        .send({
          type: 'IDENTITY_VERIFICATION.COMPLETED',
          identity_verification: {
            id: 'test_verification',
            status: 'success'
          }
        })
        .expect(200);

      // Verify user status updated
      const updatedUser = await getUserById(testUser.id);
      expect(updatedUser.kyc_verified).toBe(true);
    });
  });
});