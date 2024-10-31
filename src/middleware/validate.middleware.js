const { ValidationError } = require('../utils/errors');
const { validationResult, matchedData } = require('express-validator');
const xss = require('xss');
const Joi = require('joi');

const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate against schema
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const message = error.details
          .map(detail => detail.message)
          .join(', ');
        
        return next(new ValidationError(message));
      }

      // Sanitize input
      const sanitizedData = sanitizeObject(value);

      // Attach sanitized data to request
      req.validatedData = sanitizedData;

      next();
    } catch (err) {
      next(new ValidationError('Validation failed'));
    }
  };
};

const validateResponse = (schema) => {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      try {
        const { error, value } = schema.validate(data, {
          abortEarly: false,
          stripUnknown: false
        });

        if (error) {
          console.error('Response validation failed:', error);
          return originalJson.call(this, {
            success: false,
            error: 'Internal server error'
          });
        }

        return originalJson.call(this, value);
      } catch (err) {
        console.error('Response validation error:', err);
        return originalJson.call(this, {
          success: false,
          error: 'Internal server error'
        });
      }
    };

    next();
  };
};

function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => sanitizeObject(item));
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  validate,
  validateResponse
};