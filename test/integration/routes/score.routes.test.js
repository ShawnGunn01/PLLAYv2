const request = require('supertest');
const app = require('../../../src/server');
const scoreService = require('../../../src/services/score.service');

jest.mock('../../../src/services/score.service');

describe('Score Routes', () => {
  const validSecretKey = process.env.GAME_SECRET_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /scores', () => {
    const validScore = {
      name: 'High Score',
      description: 'Points scored in game',
      identifier: 'high_score',
      sorting: 1,
      isPublic: true
    };

    it('should create score type with valid data', async () => {
      scoreService.createScoreType.mockResolvedValue(validScore);

      const response = await request(app)
        .post('/scores')
        .set('pllay-game-secret-key', validSecretKey)
        .send(validScore)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        scoreType: validScore
      });
      expect(scoreService.createScoreType).toHaveBeenCalledWith(validScore);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/scores')
        .set('pllay-game-secret-key', validSecretKey)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/required/i);
    });

    it('should require game secret key', async () => {
      const response = await request(app)
        .post('/scores')
        .send(validScore)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid game secret key/i);
    });
  });

  describe('POST /scores/:scoreTypeId/validate', () => {
    it('should validate score successfully', async () => {
      const scoreTypeId = 'score123';
      const score = 100;

      scoreService.validateScore.mockResolvedValue(true);

      const response = await request(app)
        .post(`/scores/${scoreTypeId}/validate`)
        .set('Authorization', 'Bearer valid-token')
        .send({ score })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Score is valid'
      });
    });

    it('should handle invalid scores', async () => {
      const scoreTypeId = 'score123';
      scoreService.validateScore.mockRejectedValue(new Error('Invalid score'));

      const response = await request(app)
        .post(`/scores/${scoreTypeId}/validate`)
        .set('Authorization', 'Bearer valid-token')
        .send({ score: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/scores/score123/validate')
        .send({ score: 100 })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/authentication required/i);
    });
  });
});