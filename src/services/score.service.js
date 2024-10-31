/**
 * @module ScoreService
 * @description Service for managing game score types and validation
 */

const fetch = require('node-fetch');
const config = require('../config/pllay');

/**
 * @class ScoreService
 * @description Handles score-related operations
 */
class ScoreService {
  /**
   * @constructor
   */
  constructor() {
    this.baseUrl = config.PLLAY_API_URL;
  }

  /**
   * Creates a new score type for the game
   * @async
   * @param {Object} params - Score type parameters
   * @param {string} params.name - Name of the score type
   * @param {string} params.description - Description of the score type
   * @param {string} params.identifier - Unique identifier for the score type
   * @param {number} [params.sorting=1] - Sorting order (1: higher is better, -1: lower is better)
   * @param {boolean} [params.isPublic=true] - Whether the score type is public
   * @returns {Promise<Object>} Created score type
   * @throws {Error} If creation fails
   */
  async createScoreType({
    name,
    description,
    identifier,
    sorting = 1,
    isPublic = true
  }) {
    const response = await fetch(`${this.baseUrl}/rpc/CreateGameScoreType`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        },
        scoreType: {
          gameId: config.GAME_ID,
          name,
          description,
          identifier,
          sorting,
          status: isPublic ? 'ACTIVE' : 'HIDDEN'
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to create score type: ${data.error.code}`);
    }

    return data.result;
  }

  /**
   * Updates an existing score type
   * @async
   * @param {string} scoreTypeId - ID of the score type to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated score type
   * @throws {Error} If update fails
   */
  async updateScoreType(scoreTypeId, updates) {
    const response = await fetch(`${this.baseUrl}/rpc/UpdateGameScoreType`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        },
        scoreTypeId,
        updates
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to update score type: ${data.error.code}`);
    }

    return data.result;
  }

  /**
   * Validates a score against a score type
   * @async
   * @param {number} score - Score value to validate
   * @param {string} scoreTypeId - ID of the score type
   * @returns {Promise<boolean>} True if score is valid
   * @throws {Error} If validation fails
   */
  async validateScore(score, scoreTypeId) {
    const response = await fetch(`${this.baseUrl}/rpc/GetGameScoreType`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        },
        scoreTypeId
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to validate score: ${data.error.code}`);
    }

    if (typeof score !== 'number' || isNaN(score)) {
      throw new Error('Invalid score value');
    }

    return true;
  }

  /**
   * Compares two scores based on sorting order
   * @param {number} scoreA - First score
   * @param {number} scoreB - Second score
   * @param {number} sorting - Sorting order (1: higher is better, -1: lower is better)
   * @returns {number} Comparison result
   */
  compareScores(scoreA, scoreB, sorting) {
    if (sorting === 1) {
      return scoreB - scoreA;
    }
    return scoreA - scoreB;
  }
}

module.exports = new ScoreService();