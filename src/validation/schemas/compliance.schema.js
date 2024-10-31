const Joi = require('joi');

const complianceSchema = {
  report: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  }),

  suspiciousActivity: Joi.object({
    userId: Joi.string().required(),
    type: Joi.string().valid(
      'large_transaction',
      'unusual_pattern',
      'multiple_accounts',
      'location_mismatch',
      'rapid_transactions'
    ).required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    details: Joi.object({
      description: Joi.string().required(),
      evidence: Joi.array().items(Joi.string()),
      relatedTransactions: Joi.array().items(Joi.string())
    }).required()
  }),

  riskLevel: Joi.object({
    riskLevel: Joi.string().valid('low', 'medium', 'high', 'extreme').required(),
    reason: Joi.string().required()
  })
};

module.exports = {
  complianceSchema
};