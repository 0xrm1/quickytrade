const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded token or null if invalid
 */
const verifyToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.error('Token verification error:', error.message);
    return null;
  }
};

/**
 * Protect routes - Verify JWT token
 */
const protect = (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized to access this route'
        }
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token'
        }
      });
    }

    // Set user in request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error'
      }
    });
  }
};

/**
 * Authorize roles
 * @param {...String} roles - Roles to authorize
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'User not found in request. Protect middleware must be used first.'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Role ${req.user.role} is not authorized to access this route`
        }
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  protect,
  authorize
}; 