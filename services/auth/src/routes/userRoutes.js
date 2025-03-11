const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', userController.register);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', userController.login);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticate, userController.updateProfile);

/**
 * @route PUT /api/auth/api-keys
 * @desc Update user's API keys
 * @access Private
 */
router.put('/api-keys', authenticate, userController.updateApiKeys);

/**
 * @route GET /api/auth/api-keys
 * @desc Get user's API keys
 * @access Private
 */
router.get('/api-keys', authenticate, userController.getApiKeys);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', userController.forgotPassword);

/**
 * @route POST /api/auth/reset-password/:resetToken
 * @desc Reset password
 * @access Public
 */
router.post('/reset-password/:resetToken', userController.resetPassword);

/**
 * @route GET /api/auth/verify-email/:verificationToken
 * @desc Verify email address
 * @access Public
 */
router.get('/verify-email/:verificationToken', userController.verifyEmail);

/**
 * @route GET /api/auth/users
 * @desc Get all users (admin only)
 * @access Private/Admin
 */
router.get('/users', authenticate, isAdmin, userController.getUsers);

module.exports = router; 