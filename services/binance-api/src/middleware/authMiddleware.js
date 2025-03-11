const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorMiddleware');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return next(new ApiError(401, 'Not authorized, no token'));
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user ID to request
      req.userId = decoded.id;
      next();
    } catch (error) {
      logger.error(`Token verification failed: ${error.message}`);
      return next(new ApiError(401, 'Not authorized, token failed'));
    }
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return next(new ApiError(500, 'Authentication error'));
  }
};

/**
 * Middleware to check API key
 */
const checkApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return next(new ApiError(401, 'API key is required'));
    }
    
    // In a real application, you would validate the API key against a database
    // For now, just check if it's not empty
    if (apiKey === 'invalid') {
      return next(new ApiError(401, 'Invalid API key'));
    }
    
    next();
  } catch (error) {
    logger.error(`API key check error: ${error.message}`);
    return next(new ApiError(500, 'API key check error'));
  }
};

/**
 * Middleware to check rate limit
 */
const checkRateLimit = async (req, res, next) => {
  // In a real application, you would implement rate limiting logic here
  // For now, just pass through
  next();
};

module.exports = {
  authenticate,
  checkApiKey,
  checkRateLimit
}; 