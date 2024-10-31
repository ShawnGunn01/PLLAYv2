const SMSService = require('../../../src/services/sms.service');
const { PLLAYError } = require('../../../src/utils/errors');

jest.mock('twilio');

describe('SMSService', () => {
  let mockTwilioClient;

  beforeEach(() => {
    mockTwilioClient = {
      messages: {
        create: jest.fn()
      },
      shortCodes: jest.fn().mockReturnThis(),
      fetch: jest.fn()
    };

    require('twilio').mockImplementation(() => mockTwilioClient);
  });

  describe('sendMessage', () => {
    it('should send SMS successfully', async () => {
      const mockResponse = {
        sid: 'test_sid',
        status: 'sent'
      };

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      const response = await SMSService.sendMessage(
        '+1234567890',
        'Test message'
      );

      expect(response.status).toBe('sent');
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'Test message',
        from: expect.any(String),
        to: '+1234567890'
      });
    });

    it('should handle send errors', async () => {
      mockTwilioClient.messages.create.mockRejectedValue(new Error('Send failed'));

      await expect(
        SMSService.sendMessage('+1234567890', 'Test message')
      ).rejects.toThrow(PLLAYError);
    });
  });

  describe('handleIncomingMessage', () => {
    it('should process incoming message', async () => {
      const mockMessage = {
        From: '+1234567890',
        Body: 'Check my wager',
        MessageSid: 'test_sid'
      };

      const response = await SMSService.handleIncomingMessage(mockMessage);
      expect(response.success).toBe(true);
    });

    it('should handle unregistered users', async () => {
      const mockMessage = {
        From: '+1234567890',
        Body: 'Check my wager',
        MessageSid: 'test_sid'
      };

      SMSService.getUserIdFromPhone.mockResolvedValue(null);

      await SMSService.handleIncomingMessage(mockMessage);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('register')
        })
      );
    });
  });
});