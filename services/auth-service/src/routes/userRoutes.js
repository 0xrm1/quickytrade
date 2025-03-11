const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/userController');
const { protect, authorize, validate } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes below this middleware require authentication
router.use(protect);

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Private/Admin
 */
router.get(
  '/',
  authorize('admin'),
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
    query('isEmailVerified').optional().isBoolean().withMessage('isEmailVerified must be a boolean'),
    query('search').optional().isString().withMessage('Search must be a string')
  ]),
  userController.getAllUsers
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private (own user or admin)
 */
router.get(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('Invalid user ID')
  ]),
  userController.getUserById
);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private (own user or admin)
 */
router.put(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('role')
      .optional()
      .isIn(['user', 'admin'])
      .withMessage('Invalid role'),
    body('isEmailVerified')
      .optional()
      .isBoolean()
      .withMessage('isEmailVerified must be a boolean'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object')
  ]),
  userController.updateUser
);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Private (own user or admin)
 */
router.delete(
  '/:id',
  validate([
    param('id').isMongoId().withMessage('Invalid user ID')
  ]),
  userController.deleteUser
);

/**
 * @route PATCH /api/users/:id/preferences
 * @desc Update user preferences
 * @access Private (own user or admin)
 */
router.patch(
  '/:id/preferences',
  validate([
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('preferences')
      .isObject()
      .withMessage('Preferences must be an object'),
    body('preferences.theme')
      .optional()
      .isIn(['light', 'dark'])
      .withMessage('Theme must be either light or dark'),
    body('preferences.notifications')
      .optional()
      .isObject()
      .withMessage('Notifications must be an object'),
    body('preferences.notifications.email')
      .optional()
      .isBoolean()
      .withMessage('Email notification setting must be a boolean'),
    body('preferences.notifications.push')
      .optional()
      .isBoolean()
      .withMessage('Push notification setting must be a boolean'),
    body('preferences.defaultCurrency')
      .optional()
      .isString()
      .withMessage('Default currency must be a string')
  ]),
  userController.updatePreferences
);

/**
 * @route GET /api/users/:id/activity
 * @desc Get user activity
 * @access Private (own user or admin)
 */
router.get(
  '/:id/activity',
  validate([
    param('id').isMongoId().withMessage('Invalid user ID')
  ]),
  userController.getUserActivity
);

/**
 * @route POST /api/users/:id/revoke-sessions
 * @desc Revoke all sessions
 * @access Private (own user or admin)
 */
router.post(
  '/:id/revoke-sessions',
  validate([
    param('id').isMongoId().withMessage('Invalid user ID')
  ]),
  userController.revokeAllSessions
);

module.exports = router; 