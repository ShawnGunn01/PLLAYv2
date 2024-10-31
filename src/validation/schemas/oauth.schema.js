const Joi = require('joi');

const oauthCallbackSchema = Joi.object({
  code: Joi.string().required(),
  result: Joi.string().valid('success').required()
});

const connectionStatusSchema = Joi.object({
  userId: Joi.string().required()
}).unknown(true);

module.exports = {
  oauthCallbackSchema,
  connectionStatusSchema
};