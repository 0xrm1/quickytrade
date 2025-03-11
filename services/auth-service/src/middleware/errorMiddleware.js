const logger = require('../utils/logger');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

/**
 * Convert errors from express-validator
 */
const convertValidationError = (err, req, res, next) => {
  if (err.array && typeof err.array === 'function') {
    const validationErrors = err.array();
    const message = validationErrors.map(error => `${error.msg}`).join(', ');
    const error = new ApiError(400, message);
    return next(error);
  }
  return next(err);
};

/**
 * Convert mongoose errors
 */
const convertMongooseError = (err, req, res, next) => {
  let error = err;

  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(404, message);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ApiError(400, message);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value entered for ${field}. Please use another value.`;
    error = new ApiError(400, message);
  }

  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(err.message, { 
    error: err,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Set default values
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server Error';
  
  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = {
  ApiError,
  notFound,
  convertValidationError,
  convertMongooseError,
  errorHandler,
  // Combine all middleware for easy import
  default: [
    convertValidationError,
    convertMongooseError,
    notFound,
    errorHandler
  ]
}; 