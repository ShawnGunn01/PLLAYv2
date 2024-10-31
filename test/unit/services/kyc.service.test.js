const KYCService = require('../../../src/services/kyc.service');
const { PlaidApi } = require('plaid');
const { PLLAYError } = require('../../../src/utils/errors');

jest.mock('plaid');

describe('KYCService', () => {
  let mockPlaidClient;

  beforeEach(() => {
    mockPlaidClient = {
      linkTokenCreate: jest.fn(),
      itemPublicTokenExchange: jest.fn(),
      identityGet: jest.fn(),
      identityVerificationCreate: jest.fn(),
      identityVerificationGet: jest.fn(),
      watchlistScreeningIndividualCreate: jest.fn(),
      watchlistScreeningIndividualGet: jest.fn()
    };

    PlaidApi.mockImplementation(() => mockPlaidClient);
  });

  describe('createLinkToken', () => {
    it('should create link token successfully', async () => {
      const mockResponse = {
        data: { link_token: 'link-token' }
      };
      mockPlaidClient.linkTokenCreate.mockResolvedValue(mockResponse);

      const result = await KYCService.createLinkToken('user123');
      expect(result).toBe('link-token');
    });

    it('should throw error on failure', async () => {
      mockPlaidClient.linkTokenCreate.mockRejectedValue(new Error('API Error'));

      await expect(KYCService.createLinkToken('user123'))
        .rejects
        .toThrow(PLLAYError);
    });
  });

  describe('verifyIdentity', () => {
    it('should verify identity successfully', async () => {
      const mockExchangeResponse = {
        data: { access_token: 'access-token' }
      };
      const mockIdentityResponse = {
        data: {
          accounts: [{
            owners: [{
              names: ['John', 'Doe'],
              emails: ['john@example.com'],
              phone_numbers: [{ data: '1234567890' }]
            }]
          }]
        }
      };
      const mockVerificationResponse = {
        data: {
          id: 'verification-id',
          status: 'pending'
        }
      };

      mockPlaidClient.itemPublicTokenExchange.mockResolvedValue(mockExchangeResponse);
      mockPlaidClient.identityGet.mockResolvedValue(mockIdentityResponse);
      mockPlaidClient.identityVerificationCreate.mockResolvedValue(mockVerificationResponse);

      const result = await KYCService.verifyIdentity('user123', 'public-token');
      
      expect(result.verificationId).toBe('verification-id');
      expect(result.status).toBe('pending');
    });
  });

  describe('watchlist screening', () => {
    it('should create watchlist screening', async () => {
      const mockResponse = {
        data: {
          id: 'screening-id',
          status: 'pending',
          search_terms: {
            legal_name: 'John Doe'
          }
        }
      };

      mockPlaidClient.watchlistScreeningIndividualCreate.mockResolvedValue(mockResponse);

      const result = await KYCService.createWatchlistScreening('user123', {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        documentNumber: 'ABC123'
      });

      expect(result.screeningId).toBe('screening-id');
      expect(result.status).toBe('pending');
    });
  });
});