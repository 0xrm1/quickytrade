const jwt = require('jsonwebtoken');
const { createClient } = require('redis');
const { ApiError } = require('./errorMiddleware');
const User = require('../models/User');
const logger = require('../utils/logger');

// Initialize Redis client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_PASSWORD ? process.env.REDIS_PASSWORD + '@' : ''}${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error in Auth Middleware', err);
});

// Connect to Redis if not connected
const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

/**
 * Protect routes - Verify JWT token
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(new ApiError(401, 'Not authorized to access this route'));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user exists in Redis cache first
      await connectRedis();
      const cachedUser = await redisClient.get(`user:${decoded.id}`);

      if (cachedUser) {
        // Use cached user data
        req.user = JSON.parse(cachedUser);
        return next();
      }

      // If not in cache, get from database
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new ApiError(401, 'User no longer exists'));
      }

      // Cache user data for future requests
      await redisClient.set(
        `user:${user._id}`,
        JSON.stringify({
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }),
        { EX: 3600 } // 1 hour expiry
      );

      // Set user in request
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new ApiError(401, 'Invalid token'));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Token expired'));
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize roles
 * @param {...String} roles - Roles to authorize
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(500, 'User not found in request. Protect middleware must be used first.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Role ${req.user.role} is not authorized to access this route`));
    }

    next();
  };
};

/**
 * Optional authentication
 * If token is provided and valid, set req.user
 * If not, continue without setting req.user
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, continue without authentication
    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user exists in Redis cache first
      await connectRedis();
      const cachedUser = await redisClient.get(`user:${decoded.id}`);

      if (cachedUser) {
        // Use cached user data
        req.user = JSON.parse(cachedUser);
        return next();
      }

      // If not in cache, get from database
      const user = await User.findById(decoded.id);

      if (!user) {
        return next();
      }

      // Cache user data for future requests
      await redisClient.set(
        `user:${user._id}`,
        JSON.stringify({
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }),
        { EX: 3600 } // 1 hour expiry
      );

      // Set user in request
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      // If token is invalid, continue without authentication
      next();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Validate request body
 * @param {Array} validations - Array of express-validator validations
 */
exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    next();
  };
}; 