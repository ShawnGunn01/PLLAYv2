const scoreService = require('../../../src/services/score.service');
const fetch = require('node-fetch');

jest.mock('node-fetch');

describe('ScoreService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('createScoreType', () => {
    it('should create a new score type successfully', async () => {
      const mockResponse = {
        result: {
          _id: 'score-123',
          name: 'Test Score',
          description: 'Test Description',
          identifier: 'test_score',
          sorting: 1
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const scoreType = await scoreService.createScoreType({
        name: 'Test Score',
        description: 'Test Description',
        identifier: 'test_score'
      });

      expect(scoreType).toEqual(mockResponse.result);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when API call fails', async () => {
      const errorMessage = 'API Error';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: { code: errorMessage } })
      });

      await expect(scoreService.createScoreType({
        name: 'Test Score',
        description: 'Test Description',
        identifier: 'test_score'
      })).rejects.toThrow(errorMessage);
    });
  });

  describe('validateScore', () => {
    it('should validate score successfully', async () => {
      const mockResponse = {
        result: {
          _id: 'score-123',
          sorting: 1
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await expect(scoreService.validateScore(100, 'score-123'))
        .resolves.toBe(true);
    });

    it('should throw error for invalid score', async () => {
      await expect(scoreService.validateScore('invalid', 'score-123'))
        .rejects.toThrow('Invalid score value');
    });
  });
});