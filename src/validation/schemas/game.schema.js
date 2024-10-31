const Joi = require('joi');

const createGameModeSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().required(),
  type: Joi.string().valid('MULTIPLAYER', 'SINGLE_PLAYER').default('MULTIPLAYER'),
  maxSetDuration: Joi.number().integer().required().min(30),
  minParticipants: Joi.number().integer().required().min(2),
  maxParticipants: Joi.number().integer().required().min(Joi.ref('minParticipants')),
  penaltyPoints: Joi.number().integer(),
  setParameters: Joi.object(),
  isPublic: Joi.boolean().default(true)
});

const createScoreTypeSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().required(),
  identifier: Joi.string().required(),
  sorting: Joi.string().valid('ASC', 'DESC').default('DESC')
});

module.exports = {
  createGameModeSchema,
  createScoreTypeSchema
};