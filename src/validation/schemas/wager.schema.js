const Joi = require('joi');

const wagerSchema = {
  create: Joi.object({
    gameId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    gameData: Joi.object().default({})
  }),

  complete: Joi.object({
    won: Joi.boolean().required(),
    actualWin: Joi.number().min(0).required(),
    gameData: Joi.object().default({})
  }),

  history: Joi.object({
    status: Joi.string().valid('active', 'won', 'lost', 'cancelled'),
    gameId: Joi.string(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  })
};

module.exports = {
  wagerSchema
};