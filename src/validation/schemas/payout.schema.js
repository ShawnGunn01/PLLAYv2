const Joi = require('joi');

const payoutSchema = {
  request: Joi.object({
    amount: Joi.number().positive().required(),
    payoutMethod: Joi.string().valid('bank', 'crypto').required(),
    payoutDetails: Joi.object().required()
  }),

  process: Joi.object({
    approved: Joi.boolean().required(),
    transactionId: Joi.string().when('approved', {
      is: true,
      then: Joi.required()
    }),
    reason: Joi.string().when('approved', {
      is: false,
      then: Joi.required()
    })
  }),

  history: Joi.object({
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed'),
    payoutMethod: Joi.string().valid('bank', 'crypto'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  })
};

module.exports = {
  payoutSchema
};