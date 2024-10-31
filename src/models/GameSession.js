const { Model } = require('objection');
const BaseModel = require('./BaseModel');

class GameSession extends BaseModel {
  static get tableName() {
    return 'game_sessions';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'round_id', 'status', 'started_at'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        user_id: { type: 'string', format: 'uuid' },
        round_id: { type: 'string', minLength: 1 },
        tournament_id: { type: 'string' },
        status: { type: 'string', enum: ['active', 'completed', 'cancelled'] },
        score: { type: 'object' },
        started_at: { type: 'string', format: 'date-time' },
        ended_at: { type: ['string', 'null'], format: 'date-time' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User');
    const ScoreValidation = require('./ScoreValidation');

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'game_sessions.user_id',
          to: 'users.id'
        }
      },
      scoreValidations: {
        relation: Model.HasManyRelation,
        modelClass: ScoreValidation,
        join: {
          from: 'game_sessions.id',
          to: 'score_validations.game_session_id'
        }
      }
    };
  }
}

module.exports = GameSession;