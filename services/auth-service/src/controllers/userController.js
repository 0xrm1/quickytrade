const { validationResult } = require('express-validator');
const User = require('../models/User');
const Token = require('../models/Token');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * Get all users (admin only)
 * @route GET /api/users
 * @access Private/Admin
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filtering
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isEmailVerified) filter.isEmailVerified = req.query.isEmailVerified === 'true';
    
    // Search
    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Execute query
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (admin or self)
 * @route GET /api/users/:id
 * @access Private
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Check if user is requesting their own data or is an admin
    if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Not authorized to access this user data'));
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private
 */
exports.updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Find user
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Check if user is updating their own data or is an admin
    if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Not authorized to update this user'));
    }
    
    // Fields that can be updated
    const allowedUpdates = ['username', 'email', 'preferences'];
    
    // Admin can update additional fields
    if (req.user.role === 'admin') {
      allowedUpdates.push('role', 'isEmailVerified');
    }
    
    // Filter out fields that are not allowed to be updated
    const updates = Object.keys(req.body)
      .filter(update => allowedUpdates.includes(update))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});
    
    // If no valid updates, return error
    if (Object.keys(updates).length === 0) {
      return next(new ApiError(400, 'No valid fields to update'));
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return next(new ApiError(400, `${field} already exists`));
    }
    next(error);
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Check if user is deleting their own account or is an admin
    if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Not authorized to delete this user'));
    }
    
    // Delete user
    await user.remove();
    
    // Revoke all tokens for the user
    await Token.revokeAllUserTokens(user._id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 * @route PATCH /api/users/:id/preferences
 * @access Private
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Find user
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Check if user is updating their own preferences or is an admin
    if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Not authorized to update this user\'s preferences'));
    }
    
    // Update preferences
    const { preferences } = req.body;
    
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { preferences } },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'User preferences updated successfully',
      data: { preferences: user.preferences }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user activity
 * @route GET /api/users/:id/activity
 * @access Private
 */
exports.getUserActivity = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Check if user is requesting their own activity or is an admin
    if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Not authorized to access this user\'s activity'));
    }
    
    // Get user's active sessions (tokens)
    const activeSessions = await Token.find({
      userId: user._id,
      type: 'refresh',
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).select('createdAt expiresAt userAgent ipAddress');
    
    res.status(200).json({
      success: true,
      data: {
        lastLogin: user.lastLogin,
        activeSessions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke all sessions
 * @route POST /api/users/:id/revoke-sessions
 * @access Private
 */
exports.revokeAllSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Check if user is revoking their own sessions or is an admin
    if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Not authorized to revoke this user\'s sessions'));
    }
    
    // Revoke all refresh tokens for the user
    const result = await Token.revokeAllUserTokens(user._id, 'refresh');
    
    res.status(200).json({
      success: true,
      message: `Successfully revoked ${result.modifiedCount} sessions`
    });
  } catch (error) {
    next(error);
  }
}; 