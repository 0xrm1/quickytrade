const { validationResult } = require('express-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Token = require('../models/Token');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorMiddleware');
const { createClient } = require('redis');

// Initialize Redis client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_PASSWORD ? process.env.REDIS_PASSWORD + '@' : ''}${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error in Auth Controller', err);
});

// Connect to Redis if not connected
const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return next(new ApiError(400, 'Email already in use'));
      }
      return next(new ApiError(400, 'Username already taken'));
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      verificationToken,
      verificationTokenExpires
    });

    // Remove password from response
    user.password = undefined;

    // TODO: Send verification email

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email and include password field
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists
    if (!user) {
      return next(new ApiError(401, 'Invalid credentials'));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid credentials'));
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Calculate token expiry times
    const accessTokenExpiry = new Date(Date.now() + parseInt(process.env.JWT_EXPIRES_IN || '3600000')); // Default 1 hour
    const refreshTokenExpiry = new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800000')); // Default 7 days

    // Store refresh token in database
    await Token.create({
      userId: user._id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: refreshTokenExpiry,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    // Store user session in Redis for faster access
    await connectRedis();
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

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        },
        tokens: {
          accessToken,
          refreshToken,
          accessTokenExpiry,
          refreshTokenExpiry
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new ApiError(400, 'Refresh token is required'));
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return next(new ApiError(401, 'Invalid or expired refresh token'));
    }

    // Find token in database
    const tokenDoc = await Token.findOne({
      token: refreshToken,
      userId: decoded.id,
      type: 'refresh',
      isRevoked: false
    });

    if (!tokenDoc) {
      return next(new ApiError(401, 'Invalid refresh token'));
    }

    // Check if token is expired
    if (tokenDoc.isExpired()) {
      tokenDoc.isRevoked = true;
      await tokenDoc.save();
      return next(new ApiError(401, 'Refresh token expired'));
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError(401, 'User not found'));
    }

    // Generate new tokens
    const newAccessToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    // Calculate token expiry times
    const accessTokenExpiry = new Date(Date.now() + parseInt(process.env.JWT_EXPIRES_IN || '3600000')); // Default 1 hour
    const refreshTokenExpiry = new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800000')); // Default 7 days

    // Revoke old refresh token
    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    // Store new refresh token in database
    await Token.create({
      userId: user._id,
      token: newRefreshToken,
      type: 'refresh',
      expiresAt: refreshTokenExpiry,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          accessTokenExpiry,
          refreshTokenExpiry
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new ApiError(400, 'Refresh token is required'));
    }

    // Find and revoke the refresh token
    const tokenDoc = await Token.findOne({ token: refreshToken });
    
    if (tokenDoc) {
      tokenDoc.isRevoked = true;
      await tokenDoc.save();
    }

    // Remove user session from Redis
    if (req.user) {
      await connectRedis();
      await redisClient.del(`user:${req.user.id}`);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 * @route GET /api/auth/verify-email/:token
 * @access Public
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with the verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired verification token'));
    }

    // Update user
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    // Update user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // TODO: Send password reset email

    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Find user with the reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired reset token'));
    }

    // Update user password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Revoke all refresh tokens for the user
    await Token.revokeAllUserTokens(user._id, 'refresh');

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * @route PUT /api/auth/change-password
 * @access Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Find user by id and include password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ApiError(401, 'Current password is incorrect'));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Revoke all refresh tokens for the user except the current one
    if (req.body.revokeAll) {
      await Token.revokeAllUserTokens(user._id, 'refresh');
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
}; 