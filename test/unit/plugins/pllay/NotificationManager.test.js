const NotificationManager = require('../../../../src/plugins/pllay/notifications/NotificationManager');
const { PLLAYError } = require('../../../../src/plugins/pllay/errors');

describe('NotificationManager', () => {
  let mockService;
  let notificationManager;

  beforeEach(() => {
    mockService = {
      isInitialized: true,
      callPLLAY: jest.fn()
    };
    notificationManager = new NotificationManager(mockService);
  });

  describe('maybeShowNotifications', () => {
    it('should show notifications when conditions are met', async () => {
      mockService.callPLLAY.mockResolvedValueOnce(true);
      
      const result = await notificationManager.maybeShowNotifications();
      expect(result).toBe(true);
      expect(mockService.callPLLAY).toHaveBeenCalledWith('maybeShowNotifications');
    });

    it('should not show notifications when recently shown', async () => {
      notificationManager.lastShownTime = Date.now();
      
      const result = await notificationManager.maybeShowNotifications();
      expect(result).toBe(false);
      expect(mockService.callPLLAY).not.toHaveBeenCalled();
    });

    it('should throw if service not initialized', async () => {
      mockService.isInitialized = false;
      
      await expect(notificationManager.maybeShowNotifications())
        .rejects
        .toThrow('PLLAY service not initialized');
    });
  });

  describe('maybeShowAnnouncements', () => {
    it('should show announcements when conditions are met', async () => {
      mockService.callPLLAY.mockResolvedValueOnce(true);
      
      const result = await notificationManager.maybeShowAnnouncements();
      expect(result).toBe(true);
      expect(mockService.callPLLAY).toHaveBeenCalledWith('maybeShowAnnouncements');
    });

    it('should emit events when announcement is shown', async () => {
      mockService.callPLLAY.mockResolvedValueOnce(true);
      
      const spy = jest.fn();
      notificationManager.on('notification:shown', spy);
      
      await notificationManager.maybeShowAnnouncements();
      expect(spy).toHaveBeenCalledWith({ type: 'announcement' });
    });
  });

  describe('interval management', () => {
    it('should respect minimum interval between notifications', async () => {
      notificationManager.setMinInterval(5000);
      notificationManager.lastShownTime = Date.now();
      
      const result = await notificationManager.maybeShowNotifications();
      expect(result).toBe(false);
    });

    it('should allow setting custom intervals', () => {
      const interval = 10000;
      notificationManager.setMinInterval(interval);
      expect(notificationManager.minInterval).toBe(interval);
    });

    it('should throw for invalid intervals', () => {
      expect(() => notificationManager.setMinInterval(-1))
        .toThrow('Invalid interval value');
    });
  });
});