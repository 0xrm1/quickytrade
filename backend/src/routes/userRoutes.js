const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route POST /api/users/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', userController.register);

/**
 * @route POST /api/users/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', userController.login);

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route PUT /api/users/api-keys
 * @desc Update user's API keys
 * @access Private
 */
router.put('/api-keys', authenticate, userController.updateApiKeys);

/**
 * @route GET /api/users/api-keys
 * @desc Get user's API keys
 * @access Private
 */
router.get('/api-keys', authenticate, userController.getApiKeys);

module.exports = router; 