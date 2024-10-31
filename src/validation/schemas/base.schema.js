const Joi = require('joi');

const idSchema = Joi.string().required();

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const timestampSchema = Joi.object({
  createdAt: Joi.date().iso(),
  updatedAt: Joi.date().iso()
});

const successResponseSchema = Joi.object({
  success: Joi.boolean().required().valid(true),
  message: Joi.string().optional()
}).unknown(true);

const errorResponseSchema = Joi.object({
  success: Joi.boolean().required().valid(false),
  error: Joi.alternatives().try(
    Joi.string(),
    Joi.object({
      code: Joi.string(),
      message: Joi.string()
    })
  ).required()
});

module.exports = {
  idSchema,
  paginationSchema,
  timestampSchema,
  successResponseSchema,
  errorResponseSchema
};