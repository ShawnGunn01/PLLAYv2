const Joi = require('joi');

const analyticsSchema = {
  activity: Joi.object({
    type: Joi.string().required(),
    metadata: Joi.object().default({})
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  }),

  performance: Joi.object({
    timeframe: Joi.string().pattern(/^\d+[hdw]$/).default('1h')
  })
};

module.exports = {
  analyticsSchema
};