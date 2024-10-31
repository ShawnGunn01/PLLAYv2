const request = require('supertest');
const app = require('../../../src/server');
const paymentService = require('../../../src/services/payment.service');
const walletService = require('../../../src/services/wallet.service');
const { PLLAYError } = require('../../../src/utils/errors');

describe('Payment Integration', () => {
  let testUser;
  let testWallet;

  beforeAll(async () => {
    // Create test user and wallet
    testUser = await createTestUser();
    testWallet = await walletService.getWallet(testUser.id);
  });

  describe('Credit Card Payments', () => {
    it('should process successful credit card payment', async () => {
      const amount = 1000; // $10.00
      const paymentIntent = await paymentService.createPaymentIntent(
        testUser.id,
        amount,
        'USD'
      );

      expect(paymentIntent).toHaveProperty('clientSecret');
      
      const payment = await paymentService.processPayment(
        paymentIntent.id,
        'test_card_success'
      );

      expect(payment.status).toBe('succeeded');
      
      // Verify wallet balance updated
      const updatedWallet = await walletService.getWallet(testUser.id);
      expect(updatedWallet.balance).toBe(testWallet.balance + amount);
    });

    it('should handle failed credit card payment', async () => {
      const amount = 1000;
      const paymentIntent = await paymentService.createPaymentIntent(
        testUser.id,
        amount,
        'USD'
      );

      await expect(
        paymentService.processPayment(paymentIntent.id, 'test_card_declined')
      ).rejects.toThrow(PLLAYError);

      // Verify wallet balance unchanged
      const updatedWallet = await walletService.getWallet(testUser.id);
      expect(updatedWallet.balance).toBe(testWallet.balance);
    });
  });

  describe('Bank Account Payments', () => {
    it('should process successful ACH payment', async () => {
      const amount = 2000; // $20.00
      const bankAccount = await walletService.linkBankAccount(
        testUser.id,
        'test_bank_success'
      );

      const transfer = await walletService.initiateACHTransfer(
        testUser.id,
        bankAccount.id,
        amount,
        'Test deposit'
      );

      expect(transfer.status).toBe('pending');

      // Simulate ACH success webhook
      await request(app)
        .post('/webhooks/plaid')
        .send({
          type: 'TRANSFER.SUCCESS',
          transfer_id: transfer.transferId
        })
        .expect(200);

      // Verify wallet balance updated
      const updatedWallet = await walletService.getWallet(testUser.id);
      expect(updatedWallet.balance).toBe(testWallet.balance + amount);
    });
  });

  describe('Crypto Payments', () => {
    it('should process successful crypto payment', async () => {
      const amount = 5000; // $50.00
      const invoice = await paymentService.createCryptoInvoice(
        testUser.id,
        amount,
        'USD'
      );

      expect(invoice).toHaveProperty('paymentRequest');

      // Simulate Strike webhook
      await request(app)
        .post('/webhooks/strike')
        .send({
          type: 'invoice.paid',
          data: {
            invoiceId: invoice.id,
            amount: amount
          }
        })
        .expect(200);

      // Verify wallet balance updated
      const updatedWallet = await walletService.getWallet(testUser.id);
      expect(updatedWallet.balance).toBe(testWallet.balance + amount);
    });
  });

  describe('Refunds', () => {
    it('should process refund successfully', async () => {
      const amount = 1000;
      const payment = await createTestPayment(testUser.id, amount);

      const refund = await paymentService.refundPayment(payment.id, amount);
      expect(refund.status).toBe('succeeded');

      // Verify wallet balance updated
      const updatedWallet = await walletService.getWallet(testUser.id);
      expect(updatedWallet.balance).toBe(testWallet.balance - amount);
    });
  });
});