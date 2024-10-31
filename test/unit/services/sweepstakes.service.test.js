const SweepstakesService = require('../../../src/services/sweepstakes.service');
const { PLLAYError } = require('../../../src/utils/errors');
const db = require('../../../src/db/knex');

jest.mock('../../../src/db/knex');

describe('SweepstakesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSweepstakes', () => {
    it('should create sweepstakes successfully', async () => {
      const mockSweepstakes = {
        name: 'Test Sweepstakes',
        description: 'Test Description',
        startDate: new Date(Date.now() + 86400000), // Tomorrow
        endDate: new Date(Date.now() + 172800000),  // Day after tomorrow
        prizePool: 1000,
        maxEntries: 100
      };

      db.transaction.mockImplementation(cb => cb({ commit: jest.fn(), rollback: jest.fn() }));
      db.mockReturnValue({
        transacting: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockSweepstakes])
      });

      const result = await SweepstakesService.createSweepstakes(mockSweepstakes);
      expect(result).toEqual(mockSweepstakes);
    });

    it('should validate dates', async () => {
      const mockSweepstakes = {
        startDate: new Date(Date.now() + 172800000),
        endDate: new Date(Date.now() + 86400000)
      };

      await expect(
        SweepstakesService.createSweepstakes(mockSweepstakes)
      ).rejects.toThrow('End date must be after start date');
    });
  });

  describe('enterSweepstakes', () => {
    it('should create entries successfully', async () => {
      const mockSweepstakes = {
        id: 'test-id',
        status: 'active',
        start_date: new Date(Date.now() - 86400000),
        end_date: new Date(Date.now() + 86400000),
        max_entries: 10
      };

      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockSweepstakes),
        insert: jest.fn().mockReturnThis(),
        transacting: jest.fn().mockReturnThis()
      });

      const result = await SweepstakesService.enterSweepstakes(
        'test-id',
        'user-id',
        2
      );

      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(2);
    });

    it('should validate entry limits', async () => {
      const mockSweepstakes = {
        status: 'active',
        max_entries: 1
      };

      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockSweepstakes),
        count: jest.fn().mockResolvedValue([{ count: '1' }])
      });

      await expect(
        SweepstakesService.enterSweepstakes('test-id', 'user-id', 2)
      ).rejects.toThrow('Maximum entries limit reached');
    });
  });

  describe('drawWinners', () => {
    it('should select winners correctly', async () => {
      const mockSweepstakes = {
        id: 'test-id',
        status: 'active',
        prize_pool: 1000,
        drawing_rules: { numWinners: 3 }
      };

      const mockEntries = [
        { id: '1', user_id: 'user1' },
        { id: '2', user_id: 'user2' },
        { id: '3', user_id: 'user3' }
      ];

      db.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockSweepstakes),
        select: jest.fn().mockResolvedValue(mockEntries),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        transacting: jest.fn().mockReturnThis()
      });

      const winners = await SweepstakesService.drawWinners('test-id');
      expect(winners).toHaveLength(3);
    });
  });
});