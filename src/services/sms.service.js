const twilio = require('twilio');
const logger = require('../utils/logger');
const { PLLAYError } = require('../utils/errors');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.shortCode = process.env.TWILIO_SHORT_CODE;
  }

  async sendMessage(to, message) {
    try {
      const response = await this.client.messages.create({
        body: message,
        from: this.shortCode,
        to
      });

      logger.info('SMS sent:', {
        messageId: response.sid,
        to,
        status: response.status
      });

      return response;
    } catch (error) {
      logger.error('SMS send error:', error);
      throw new PLLAYError('Failed to send SMS', error);
    }
  }

  async validateShortCode() {
    try {
      const shortCode = await this.client.shortCodes(this.shortCode).fetch();
      return shortCode.capabilities;
    } catch (error) {
      logger.error('Short code validation error:', error);
      throw new PLLAYError('Invalid short code', error);
    }
  }

  async handleIncomingMessage(messageData) {
    try {
      const { From: from, Body: message, MessageSid: messageId } = messageData;

      logger.info('Incoming SMS:', { from, messageId });

      // Extract user ID from phone number mapping
      const userId = await this.getUserIdFromPhone(from);
      if (!userId) {
        return this.sendMessage(from, 'Please register first at pllay.io');
      }

      // Process message through AI agent
      const response = await aiAgentService.handleMessage(userId, message, 'sms');

      // Send response back to user
      await this.sendMessage(from, response);

      return { success: true };
    } catch (error) {
      logger.error('SMS handling error:', error);
      throw new PLLAYError('Failed to handle SMS', error);
    }
  }

  async getUserIdFromPhone(phone) {
    const user = await db('users')
      .where('phone', phone)
      .select('id')
      .first();
    return user?.id;
  }
}

module.exports = new SMSService();