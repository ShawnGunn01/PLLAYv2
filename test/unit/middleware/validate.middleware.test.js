const { validate, validateResponse } = require('../../../src/middleware/validate.middleware');
const { ValidationError } = require('../../../src/utils/errors');
const Joi = require('joi');

describe('Validate Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('validate', () => {
    it('should pass validation for valid data', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      mockReq.body = { name: 'test' };

      validate(schema)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.validatedData).toEqual({ name: 'test' });
    });

    it('should sanitize XSS in input', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      mockReq.body = { name: '<script>alert("xss")</script>test' };

      validate(schema)(mockReq, mockRes, mockNext);

      expect(mockReq.validatedData.name).not.toContain('<script>');
    });

    it('should handle validation errors', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      mockReq.body = {};

      validate(schema)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateResponse', () => {
    it('should validate successful response', () => {
      const schema = Joi.object({
        success: Joi.boolean().required(),
        data: Joi.string().required()
      });

      const middleware = validateResponse(schema);
      middleware(mockReq, mockRes, mockNext);

      mockRes.json({ success: true, data: 'test' });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: 'test'
      });
    });

    it('should handle invalid response', () => {
      const schema = Joi.object({
        success: Joi.boolean().required(),
        data: Joi.string().required()
      });

      const middleware = validateResponse(schema);
      middleware(mockReq, mockRes, mockNext);

      mockRes.json({ success: true }); // Missing required data field

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });
});