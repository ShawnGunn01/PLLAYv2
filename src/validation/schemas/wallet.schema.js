const Joi = require('joi');

const walletSchema = {
  transactionHistory: Joi.object({
    type: Joi.string().valid('deposit', 'withdrawal', 'wager', 'winning', 'refund'),
    status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  })
};

module.exports = {
  walletSchema
};