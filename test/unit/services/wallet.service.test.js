const WalletService = require('../../../src/services/wallet.service');
const { PlaidApi } = require('plaid');
const { PLLAYError } = require('../../../src/utils/errors');
const cache = require('../../../src/utils/cache');

jest.mock('plaid');
jest.mock('../../../src/utils/cache');

describe('WalletService', () => {
  let mockPlaidClient;

  beforeEach(() => {
    mockPlaidClient = {
      linkTokenCreate: jest.fn(),
      itemPublicTokenExchange: jest.fn(),
      authGet: jest.fn(),
      accountsBalanceGet: jest.fn(),
      transferCreate: jest.fn(),
      transferGet: jest.fn()
    };

    PlaidApi.mockImplementation(() => mockPlaidClient);
    cache.get.mockClear();
    cache.set.mockClear();
  });

  describe('createLinkToken', () => {
    it('should create link token successfully', async () => {
      const mockResponse = {
        data: { link_token: 'link-token' }
      };
      mockPlaidClient.linkTokenCreate.mockResolvedValue(mockResponse);

      const result = await WalletService.createLinkToken('user123');
      expect(result).toBe('link-token');
    });

    it('should throw error on failure', async () => {
      mockPlaidClient.linkTokenCreate.mockRejectedValue(new Error('API Error'));

      await expect(WalletService.createLinkToken('user123'))
        .rejects
        .toThrow(PLLAYError);
    });
  });

  describe('linkBankAccount', () => {
    it('should link account successfully', async () => {
      const mockExchangeResponse = {
        data: { access_token: 'access-token' }
      };
      const mockAuthResponse = {
        data: {
          accounts: [{
            account_id: 'account123',
            name: 'Checking',
            type: 'depository'
          }],
          numbers: {
            ach: [{
              account_id: 'account123',
              account: '1234',
              routing: '5678'
            }]
          }
        }
      };

      mockPlaidClient.itemPublicTokenExchange.mockResolvedValue(mockExchangeResponse);
      mockPlaidClient.authGet.mockResolvedValue(mockAuthResponse);

      const result = await WalletService.linkBankAccount('user123', 'public-token');
      
      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].id).toBe('account123');
      expect(cache.set).toHaveBeenCalled();
    });
  });

  describe('initiateACHTransfer', () => {
    it('should create transfer successfully', async () => {
      const mockAccountInfo = {
        accessToken: 'access-token',
        accounts: [{ name: 'Checking' }],
        numbers: {
          ach: [{
            account_id: 'account123',
            account: '1234',
            routing: '5678'
          }]
        }
      };

      const mockTransferResponse = {
        data: {
          transfer: {
            id: 'transfer123',
            status: 'pending'
          }
        }
      };

      cache.get.mockResolvedValue(mockAccountInfo);
      mockPlaidClient.transferCreate.mockResolvedValue(mockTransferResponse);

      const result = await WalletService.initiateACHTransfer(
        'user123',
        'account123',
        100,
        'Test transfer'
      );

      expect(result.transferId).toBe('transfer123');
      expect(result.status).toBe('pending');
    });

    it('should throw error if no linked account', async () => {
      cache.get.mockResolvedValue(null);

      await expect(WalletService.initiateACHTransfer(
        'user123',
        'account123',
        100,
        'Test transfer'
      )).rejects.toThrow('No linked bank account found');
    });
  });
});