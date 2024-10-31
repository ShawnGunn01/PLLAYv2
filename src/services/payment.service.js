const fetch = require('node-fetch');
const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.baseUrl = process.env.PAYMENT_API_URL;
    this.apiKey = process.env.PAYMENT_API_KEY;
  }

  async createPaymentIntent(userId, amount, currency = 'USD') {
    try {
      const response = await fetch(`${this.baseUrl}/payment/intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          amount,
          currency
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new PLLAYError(data.message || 'Failed to create payment intent');
      }

      return data;
    } catch (error) {
      logger.error('Payment intent creation error:', error);
      throw new PLLAYError('Failed to create payment intent', error);
    }
  }

  async processPayment(paymentIntentId, paymentMethodId) {
    try {
      const response = await fetch(`${this.baseUrl}/payment/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new PLLAYError(data.message || 'Payment processing failed');
      }

      return data;
    } catch (error) {
      logger.error('Payment processing error:', error);
      throw new PLLAYError('Payment processing failed', error);
    }
  }

  async refundPayment(paymentId, amount) {
    try {
      const response = await fetch(`${this.baseUrl}/payment/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId,
          amount
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new PLLAYError(data.message || 'Refund failed');
      }

      return data;
    } catch (error) {
      logger.error('Refund error:', error);
      throw new PLLAYError('Refund failed', error);
    }
  }

  async getPaymentMethods(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/payment-methods/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new PLLAYError(data.message || 'Failed to get payment methods');
      }

      return data;
    } catch (error) {
      logger.error('Get payment methods error:', error);
      throw new PLLAYError('Failed to get payment methods', error);
    }
  }

  async getTransactionHistory(userId, options = {}) {
    try {
      const queryParams = new URLSearchParams({
        limit: options.limit || 10,
        offset: options.offset || 0,
        status: options.status || '',
        startDate: options.startDate || '',
        endDate: options.endDate || ''
      });

      const response = await fetch(
        `${this.baseUrl}/transactions/${userId}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new PLLAYError(data.message || 'Failed to get transaction history');
      }

      return data;
    } catch (error) {
      logger.error('Get transaction history error:', error);
      throw new PLLAYError('Failed to get transaction history', error);
    }
  }
}

module.exports = new PaymentService();