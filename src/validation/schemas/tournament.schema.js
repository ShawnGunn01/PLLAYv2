const Joi = require('joi');

const createTournamentSeriesSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string(),
  gameMode: Joi.string().required(),
  maxSetDuration: Joi.number().integer().required().min(30),
  penaltyPoints: Joi.number().integer(),
  startTime: Joi.date().iso().greater('now').required(),
  duration: Joi.object({
    days: Joi.number().integer().min(0),
    hours: Joi.number().integer().min(0),
    minutes: Joi.number().integer().min(0),
    seconds: Joi.number().integer().min(0)
  }).required(),
  frequency: Joi.object({
    days: Joi.number().integer().min(0),
    hours: Joi.number().integer().min(0),
    minutes: Joi.number().integer().min(0),
    seconds: Joi.number().integer().min(0)
  }).required(),
  stageMode: Joi.string().valid('BRACKET', 'ROUND_ROBIN').default('BRACKET')
});

const validateScoreSchema = Joi.object({
  tournamentId: Joi.string().required(),
  roundId: Joi.string().required(),
  score: Joi.number().required(),
  clientScore: Joi.number().required()
});

module.exports = {
  createTournamentSeriesSchema,
  validateScoreSchema
};