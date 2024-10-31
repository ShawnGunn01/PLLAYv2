const Joi = require('joi');

const adminSchema = {
  userManagement: Joi.object({
    action: Joi.string().valid('suspend', 'reinstate', 'updateRisk').required(),
    reason: Joi.string().when('action', {
      is: 'suspend',
      then: Joi.required()
    }),
    riskLevel: Joi.string().valid('low', 'medium', 'high', 'extreme').when('action', {
      is: 'updateRisk',
      then: Joi.required()
    })
  }),

  tournamentManagement: Joi.object({
    action: Joi.string().valid('cancel', 'pause', 'resume').required(),
    reason: Joi.string().when('action', {
      is: 'cancel',
      then: Joi.required()
    })
  }),

  kycReview: Joi.object({
    decision: Joi.string().valid('approved', 'rejected').required(),
    notes: Joi.string().max(1000)
  })
};

module.exports = {
  adminSchema
};