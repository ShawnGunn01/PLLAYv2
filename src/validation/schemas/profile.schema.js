const Joi = require('joi');

const profileSchema = {
  update: Joi.object({
    username: Joi.string().min(3).max(30),
    bio: Joi.string().max(500),
    settings: Joi.object({
      notifications: Joi.boolean(),
      privacy: Joi.string().valid('public', 'private'),
      language: Joi.string().length(2)
    })
  }).min(1)
};

module.exports = {
  profileSchema
};