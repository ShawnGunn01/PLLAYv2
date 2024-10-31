const Joi = require('joi');

const leaderboardSchema = {
  options: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(100),
    offset: Joi.number().integer().min(0).default(0),
    timeframe: Joi.string().valid('daily', 'weekly', 'monthly', 'all').default('all')
  })
};

module.exports = {
  leaderboardSchema
};