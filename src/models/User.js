const { Model } = require('objection');
const BaseModel = require('./BaseModel');

class User extends BaseModel {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['pllay_user_id', 'username'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        pllay_user_id: { type: 'string', minLength: 1 },
        username: { type: 'string', minLength: 1 },
        metadata: { type: 'object' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const GameSession = require('./GameSession');
    const TournamentParticipant = require('./TournamentParticipant');

    return {
      gameSessions: {
        relation: Model.HasManyRelation,
        modelClass: GameSession,
        join: {
          from: 'users.id',
          to: 'game_sessions.user_id'
        }
      },
      tournamentParticipations: {
        relation: Model.HasManyRelation,
        modelClass: TournamentParticipant,
        join: {
          from: 'users.id',
          to: 'tournament_participants.user_id'
        }
      }
    };
  }
}

module.exports = User;