const Joi = require('joi');
const { idSchema } = require('./base.schema');

const createScoreSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().required(),
  identifier: Joi.string().required().pattern(/^[a-zA-Z0-9_-]+$/),
  sorting: Joi.number().valid(1, -1).default(1),
  isPublic: Joi.boolean().default(true)
});

const updateScoreSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string(),
  sorting: Joi.number().valid(1, -1),
  isPublic: Joi.boolean()
}).min(1);

const validateScoreSchema = Joi.object({
  score: Joi.number().required(),
  scoreTypeId: idSchema
});

const scoreResponseSchema = Joi.object({
  success: Joi.boolean().required().valid(true),
  scoreType: Joi.object({
    id: idSchema,
    name: Joi.string().required(),
    description: Joi.string().required(),
    sorting: Joi.number().valid(1, -1).required(),
    isPublic: Joi.boolean().required()
  })
});

module.exports = {
  createScoreSchema,
  updateScoreSchema,
  validateScoreSchema,
  scoreResponseSchema
};