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
 * Middleware to check if user is admin
 */
const isAdmin = async (req, res, next) => {
  try {
    // Get user from database
    const user = await User.findById(req.userId);
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return next(new ApiError(403, 'Not authorized as admin'));
    }
    
    next();
  } catch (error) {
    logger.error(`Admin check error: ${error.message}`);
    return next(new ApiError(500, 'Admin check error'));
  }
};

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

module.exports = {
  authenticate,
  isAdmin,
  generateToken
}; 