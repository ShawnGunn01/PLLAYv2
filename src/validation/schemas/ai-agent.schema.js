const Joi = require('joi');

const aiAgentSchema = {
  message: Joi.object({
    message: Joi.string().required().max(1000)
  }),

  smsWebhook: Joi.object({
    from: Joi.string().required(),
    message: Joi.string().required(),
    userId: Joi.string().required()
  }),

  iMessageWebhook: Joi.object({
    from: Joi.string().required(),
    message: Joi.string().required(),
    userId: Joi.string().required()
  })
};

module.exports = {
  aiAgentSchema
};