const express = require('express');
const { body, param } = require('express-validator');
const authController = require('../controllers/authController');
const { protect, validate } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  validate([
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('Password must contain a number')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter')
  ]),
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  validate([
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ]),
  authController.login
);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post(
  '/refresh-token',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ]),
  authController.refreshToken
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post(
  '/logout',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ]),
  protect,
  authController.logout
);

/**
 * @route GET /api/auth/verify-email/:token
 * @desc Verify email
 * @access Public
 */
router.get(
  '/verify-email/:token',
  validate([
    param('token').notEmpty().withMessage('Token is required')
  ]),
  authController.verifyEmail
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post(
  '/forgot-password',
  validate([
    body('email').trim().isEmail().withMessage('Please provide a valid email')
  ]),
  authController.forgotPassword
);

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Reset password
 * @access Public
 */
router.post(
  '/reset-password/:token',
  validate([
    param('token').notEmpty().withMessage('Token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('Password must contain a number')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter')
  ]),
  authController.resetPassword
);

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', protect, authController.getCurrentUser);

/**
 * @route PUT /api/auth/change-password
 * @desc Change password
 * @access Private
 */
router.put(
  '/change-password',
  protect,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('New password must contain a number')
      .matches(/[A-Z]/)
      .withMessage('New password must contain an uppercase letter'),
    body('revokeAll').optional().isBoolean()
  ]),
  authController.changePassword
);

module.exports = router; 