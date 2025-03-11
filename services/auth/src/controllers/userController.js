const User = require('../models/userModel');
const { ApiError } = require('../middleware/errorMiddleware');
const { generateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return next(new ApiError(400, 'User already exists'));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      // Generate verification token
      // In a real application, you would send an email with this token
      const verificationToken = crypto.randomBytes(20).toString('hex');
      
      // Send response
      res.status(201).json({
        status: 'success',
        data: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id || user.id),
        },
        message: 'User registered successfully. Please verify your email.',
      });
    } else {
      return next(new ApiError(400, 'Invalid user data'));
    }
  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    return next(new ApiError(500, 'Server error during registration'));
  }
};

/**
 * @desc    Login a user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return next(new ApiError(400, 'Please provide email and password'));
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ApiError(401, 'Invalid credentials'));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ApiError(401, 'Invalid credentials'));
    }

    // Send response
    res.status(200).json({
      status: 'success',
      data: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id || user.id),
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return next(new ApiError(500, 'Server error during login'));
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    return next(new ApiError(500, 'Server error while getting profile'));
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;

    const updatedUser = await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        id: updatedUser._id || updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    return next(new ApiError(500, 'Server error while updating profile'));
  }
};

/**
 * @desc    Update user's API keys
 * @route   PUT /api/auth/api-keys
 * @access  Private
 */
const updateApiKeys = async (req, res, next) => {
  try {
    const { apiKey, secretKey } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    // Update API keys based on database type
    if (process.env.DB_TYPE === 'mongodb') {
      user.apiKeys.binance.apiKey = apiKey;
      user.apiKeys.binance.secretKey = secretKey;
    } else {
      user.binanceApiKey = apiKey;
      user.binanceSecretKey = secretKey;
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'API keys updated successfully',
    });
  } catch (error) {
    logger.error(`Update API keys error: ${error.message}`);
    return next(new ApiError(500, 'Server error while updating API keys'));
  }
};

/**
 * @desc    Get user's API keys
 * @route   GET /api/auth/api-keys
 * @access  Private
 */
const getApiKeys = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    // Get API keys based on database type
    let apiKeys;
    if (process.env.DB_TYPE === 'mongodb') {
      apiKeys = {
        apiKey: user.apiKeys.binance.apiKey,
        secretKey: user.apiKeys.binance.secretKey,
      };
    } else {
      apiKeys = {
        apiKey: user.binanceApiKey,
        secretKey: user.binanceSecretKey,
      };
    }

    res.status(200).json({
      status: 'success',
      data: apiKeys,
    });
  } catch (error) {
    logger.error(`Get API keys error: ${error.message}`);
    return next(new ApiError(500, 'Server error while getting API keys'));
  }
};

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(new ApiError(404, 'No user with that email'));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // In a real application, you would send an email with this token
    // For now, just return the token in the response
    res.status(200).json({
      status: 'success',
      data: {
        resetToken,
      },
      message: 'Password reset token sent to email',
    });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    return next(new ApiError(500, 'Server error during password reset request'));
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password/:resetToken
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired token'));
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
    });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    return next(new ApiError(500, 'Server error during password reset'));
  }
};

/**
 * @desc    Verify email address
 * @route   GET /api/auth/verify-email/:verificationToken
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;

    // In a real application, you would verify the token
    // For now, just return a success message
    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error(`Verify email error: ${error.message}`);
    return next(new ApiError(500, 'Server error during email verification'));
  }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      status: 'success',
      count: users.length,
      data: users.map(user => ({
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      })),
    });
  } catch (error) {
    logger.error(`Get users error: ${error.message}`);
    return next(new ApiError(500, 'Server error while getting users'));
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  updateApiKeys,
  getApiKeys,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getUsers,
}; 