const PLLAYService = require('../../../../src/plugins/pllay/PLLAYService');
const { PLLAYError } = require('../../../../src/plugins/pllay/errors');

describe('PLLAYService Notifications', () => {
  let mockWindow;

  beforeEach(() => {
    mockWindow = {
      PLLAY: {
        maybeShowNotifications: jest.fn(),
        maybeShowAnnouncements: jest.fn(),
        setTrackingParams: jest.fn(),
        getStatus: jest.fn(),
        getIngameRewards: jest.fn()
      }
    };
    global.window = mockWindow;
    PLLAYService.isInitialized = true;
  });

  afterEach(() => {
    PLLAYService.isInitialized = false;
    jest.clearAllMocks();
  });

  describe('notifications and announcements', () => {
    it('should show notifications when appropriate', async () => {
      await PLLAYService.maybeShowNotifications();
      expect(mockWindow.PLLAY.maybeShowNotifications).toHaveBeenCalled();
    });

    it('should show announcements when appropriate', async () => {
      await PLLAYService.maybeShowAnnouncements();
      expect(mockWindow.PLLAY.maybeShowAnnouncements).toHaveBeenCalled();
    });

    it('should throw if not initialized', async () => {
      PLLAYService.isInitialized = false;
      await expect(PLLAYService.maybeShowNotifications())
        .rejects
        .toThrow('PLLAY plugin not initialized');
    });
  });

  describe('tracking params', () => {
    it('should set tracking params', () => {
      const params = { param1: 'value1', param2: 'value2' };
      PLLAYService.setTrackingParams(params);
      
      expect(mockWindow.PLLAY.setTrackingParams)
        .toHaveBeenCalledWith(params);
      expect(PLLAYService.trackingParams).toEqual(params);
    });

    it('should throw for invalid params', () => {
      expect(() => PLLAYService.setTrackingParams('invalid'))
        .toThrow('Tracking params must be an object');
    });
  });

  describe('status and rewards', () => {
    it('should get current status', async () => {
      const mockStatus = {
        loggedIn: true,
        subscription: { active: true },
        gameId: 'game-1'
      };

      mockWindow.PLLAY.getStatus.mockResolvedValueOnce(mockStatus);

      const status = await PLLAYService.getStatus();
      expect(status).toEqual({
        ...mockStatus,
        initialized: true,
        trackingParams: {}
      });
    });

    it('should get in-game rewards', async () => {
      const mockRewards = {
        count: 2,
        data: [
          { _id: 'reward-1', rewardData: 'coins:100' },
          { _id: 'reward-2', rewardData: 'gems:50' }
        ]
      };

      mockWindow.PLLAY.getIngameRewards.mockResolvedValueOnce(mockRewards);

      const rewards = await PLLAYService.getIngameRewards();
      expect(rewards).toEqual(mockRewards);
    });
  });
});