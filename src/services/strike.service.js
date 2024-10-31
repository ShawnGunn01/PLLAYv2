const fetch = require('node-fetch');
const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');

class StrikeService {
  constructor() {
    this.baseUrl = process.env.STRIKE_API_URL || 'https://api.strike.me/v1';
    this.apiKey = process.env.STRIKE_API_KEY;
  }

  async createInvoice(amount, currency = 'USD', description) {
    try {
      const response = await fetch(`${this.baseUrl}/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: {
            amount,
            currency
          },
          description,
          correlationId: `pllay-${Date.now()}`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new PLLAYError(data.message || 'Failed to create invoice');
      }

      return data;
    } catch (error) {
      logger.error('Strike invoice creation error:', error);
      throw new PLLAYError('Failed to create invoice', error);
    }
  }

  async getInvoice(invoiceId) {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new PLLAYError(data.message || 'Failed to get invoice');
      }

      return data;
    } catch (error) {
      logger.error('Strike get invoice error:', error);
      throw new PLLAYError('Failed to get invoice', error);
    }
  }

  async createQuote(invoiceId) {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/${invoiceId}/quote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new PLLAYError(data.message || 'Failed to create quote');
      }

      return data;
    } catch (error) {
      logger.error('Strike quote creation error:', error);
      throw new PLLAYError('Failed to create quote', error);
    }
  }

  async getQuote(quoteId) {
    try {
      const response = await fetch(`${this.baseUrl}/quotes/${quoteId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new PLLAYError(data.message || 'Failed to get quote');
      }

      return data;
    } catch (error) {
      logger.error('Strike get quote error:', error);
      throw new PLLAYError('Failed to get quote', error);
    }
  }

  async handleWebhook(payload, signature) {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload, signature)) {
        throw new PLLAYError('Invalid webhook signature');
      }

      const event = JSON.parse(payload);

      switch (event.type) {
        case 'invoice.created':
          await this.handleInvoiceCreated(event.data);
          break;
        case 'invoice.updated':
          await this.handleInvoiceUpdated(event.data);
          break;
        case 'quote.expired':
          await this.handleQuoteExpired(event.data);
          break;
        default:
          logger.warn('Unhandled webhook event type:', event.type);
      }

      return true;
    } catch (error) {
      logger.error('Strike webhook handling error:', error);
      throw new PLLAYError('Failed to handle webhook', error);
    }
  }

  verifyWebhookSignature(payload, signature) {
    // Implement Strike webhook signature verification
    // https://docs.strike.me/webhooks#verifying-webhooks
    return true; // TODO: Implement actual verification
  }

  async handleInvoiceCreated(data) {
    logger.info('Invoice created:', data.invoiceId);
    // Handle invoice creation event
  }

  async handleInvoiceUpdated(data) {
    logger.info('Invoice updated:', data.invoiceId, 'Status:', data.state);
    // Handle invoice update event
    if (data.state === 'PAID') {
      await this.processSuccessfulPayment(data);
    }
  }

  async handleQuoteExpired(data) {
    logger.info('Quote expired:', data.quoteId);
    // Handle quote expiration event
  }

  async processSuccessfulPayment(invoiceData) {
    try {
      // Update user's balance or process game credits
      logger.info('Processing successful payment:', invoiceData);
      
      // Emit payment success event
      this.emit('payment.success', {
        invoiceId: invoiceData.invoiceId,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Payment processing error:', error);
      throw new PLLAYError('Failed to process payment', error);
    }
  }
}

module.exports = new StrikeService();