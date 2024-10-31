const Joi = require('joi');

const securitySchema = {
  verify2FA: Joi.object({
    token: Joi.string().length(6).pattern(/^\d+$/).required()
  }),

  monitorTransaction: Joi.object({
    amount: Joi.number().positive().required(),
    type: Joi.string().required(),
    paymentMethod: Joi.string().required(),
    metadata: Joi.object()
  })
};

module.exports = {
  securitySchema
};