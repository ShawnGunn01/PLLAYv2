const Joi = require('joi');

const sweepstakesSchema = {
  create: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    prizePool: Joi.number().positive().required(),
    maxEntries: Joi.number().integer().positive().required(),
    entryRequirements: Joi.object({
      minLevel: Joi.number().integer().min(1),
      kycRequired: Joi.boolean().default(true),
      locationRestrictions: Joi.array().items(Joi.string())
    }).default({}),
    drawingRules: Joi.object({
      numWinners: Joi.number().integer().min(1).default(1),
      prizeDistribution: Joi.object().pattern(
        Joi.number().integer().min(1),
        Joi.number().min(0).max(1)
      )
    }).default({})
  }),

  enter: Joi.object({
    entries: Joi.number().integer().min(1).max(100).default(1)
  })
};

module.exports = {
  sweepstakesSchema
};