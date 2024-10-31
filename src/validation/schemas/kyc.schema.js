const Joi = require('joi');

const kycSchema = {
  verify: Joi.object({
    publicToken: Joi.string().required()
  }),

  retry: Joi.object({
    template: Joi.string().required()
  })
};

module.exports = {
  kycSchema
};