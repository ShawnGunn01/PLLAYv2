const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const CircuitBreaker = require('../utils/circuit-breaker');

// Create circuit breakers for external services
const circuitBreakers = {
  pllay: new CircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 }),
  oauth: new CircuitBreaker({ failureThreshold: 3, resetTimeout: 60000 })
};

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

const handleCircuitBreakerError = (err) => {
  const message = 'Service temporarily unavailable. Please try again later.';
  return new AppError(message, 503, 'CIRCUIT_BREAKER_OPEN');
};

const sendErrorDev = (err, res) => {
  logger.error('Development Error', {
    error: err,
    stack: err.stack
  });

  res.status(err.statusCode).json({
    success: false,
    error: {
      code: err.code,
      status: err.status,
      message: err.message,
      stack: err.stack
    }
  });
};

const sendErrorProd = (err, res) => {
  logger.error('Production Error', {
    error: err.message,
    code: err.code,
    stack: err.stack
  });

  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong'
      }
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'CircuitBreakerError') error = handleCircuitBreakerError(error);

    sendErrorProd(error, res);
  }
};

module.exports.circuitBreakers = circuitBreakers;