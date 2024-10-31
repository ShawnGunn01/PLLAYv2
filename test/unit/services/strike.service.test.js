const StrikeService = require('../../../src/services/strike.service');
const { PLLAYError } = require('../../../src/utils/errors');
const fetch = require('node-fetch');

jest.mock('node-fetch');

describe('StrikeService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      const mockResponse = {
        invoiceId: 'inv_123',
        amount: {
          amount: '100.00',
          currency: 'USD'
        },
        state: 'UNPAID'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await StrikeService.createInvoice(100, 'USD', 'Test payment');
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/invoices'),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'API Error' })
      });

      await expect(StrikeService.createInvoice(100, 'USD', 'Test'))
        .rejects
        .toThrow(PLLAYError);
    });
  });

  describe('webhook handling', () => {
    it('should process paid invoice', async () => {
      const mockPayload = {
        type: 'invoice.updated',
        data: {
          invoiceId: 'inv_123',
          state: 'PAID',
          amount: {
            amount: '100.00',
            currency: 'USD'
          }
        }
      };

      const result = await StrikeService.handleWebhook(
        JSON.stringify(mockPayload),
        'test-signature'
      );

      expect(result).toBe(true);
    });

    it('should verify webhook signature', () => {
      const mockPayload = JSON.stringify({ test: 'data' });
      const mockSignature = 'test-signature';

      const result = StrikeService.verifyWebhookSignature(
        mockPayload,
        mockSignature
      );

      expect(result).toBe(true);
    });
  });
});