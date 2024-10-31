const Joi = require('joi');

const paymentSchema = {
  intent: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).default('USD')
  }),

  process: Joi.object({
    paymentIntentId: Joi.string().required(),
    paymentMethodId: Joi.string().required()
  }),

  refund: Joi.object({
    paymentId: Joi.string().required(),
    amount: Joi.number().positive().required()
  })
};

module.exports = {
  paymentSchema
};