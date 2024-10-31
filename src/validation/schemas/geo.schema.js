const Joi = require('joi');

const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});

const geoSchema = {
  locationCheck: Joi.object({
    ip: Joi.string().ip({
      version: ['ipv4'],
      cidr: false
    }),
    gameType: Joi.string().valid('CARDS', 'DOMINOES', 'SKILL_BASED').optional()
  }),

  createGeofence: Joi.object({
    name: Joi.string().required(),
    center: locationSchema.required(),
    radius: Joi.number().positive().required(),
    restrictions: Joi.object({
      gameTypes: Joi.array().items(Joi.string()),
      minLevel: Joi.number().integer().min(0),
      maxPlayers: Joi.number().integer().positive(),
      timeRestrictions: Joi.array().items(Joi.object({
        dayOfWeek: Joi.number().min(0).max(6),
        startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
        endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      }))
    }).default({})
  }),

  checkGeofence: Joi.object({
    location: locationSchema.required()
  })
};

module.exports = {
  geoSchema
};