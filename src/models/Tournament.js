const { Model } = require('objection');
const BaseModel = require('./BaseModel');

class Tournament extends BaseModel {
  static get tableName() {
    return 'tournaments';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['tournament_id', 'status'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        tournament_id: { type: 'string', minLength: 1 },
        status: { type: 'string', enum: ['pending', 'active', 'completed', 'cancelled'] },
        metadata: { type: 'object' },
        started_at: { type: ['string', 'null'], format: 'date-time' },
        ended_at: { type: ['string', 'null'], format: 'date-time' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const TournamentParticipant = require('./TournamentParticipant');

    return {
      participants: {
        relation: Model.HasManyRelation,
        modelClass: TournamentParticipant,
        join: {
          from: 'tournaments.id',
          to: 'tournament_participants.tournament_id'
        }
      }
    };
  }
}

module.exports = Tournament;