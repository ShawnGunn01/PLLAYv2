const Joi = require('joi');

const cryptoPaymentSchema = {
  createInvoice: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).default('USD'),
    description: Joi.string().required()
  })
};

module.exports = {
  cryptoPaymentSchema
};