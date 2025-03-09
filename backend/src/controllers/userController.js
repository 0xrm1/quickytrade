const User = require('../models/userModel');
const authUtils = require('../utils/authUtils');

/**
 * User controller for handling user-related operations
 */
const userController = {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  register: async (req, res) => {
    try {
      const { email, password, binanceApiKey, binanceSecretKey } = req.body;
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid email format'
        });
      }
      
      // Validate password length
      if (password.length < 8) {
        return res.status(400).json({
          status: 'error',
          message: 'Password must be at least 8 characters long'
        });
      }
      
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'Email already in use'
        });
      }
      
      // Hash password
      const hashedPassword = await authUtils.hashPassword(password);
      
      // Encrypt API keys if provided
      const encryptedApiKey = binanceApiKey ? authUtils.encryptData(binanceApiKey) : null;
      const encryptedSecretKey = binanceSecretKey ? authUtils.encryptData(binanceSecretKey) : null;
      
      // Create user
      const newUser = await User.create({
        email,
        password: hashedPassword,
        binance_api_key: encryptedApiKey,
        binance_secret_key: encryptedSecretKey
      });
      
      // Generate JWT token
      const token = authUtils.generateToken({ id: newUser.id, email: newUser.email });
      
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            created_at: newUser.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to register user'
      });
    }
  },

  /**
   * Login a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }
      
      // Verify password
      const isPasswordValid = await authUtils.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }
      
      // Generate JWT token
      const token = authUtils.generateToken({ id: user.id, email: user.email });
      
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to login'
      });
    }
  },

  /**
   * Update user's API keys
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateApiKeys: async (req, res) => {
    try {
      const userId = req.user.id;
      const { binanceApiKey, binanceSecretKey } = req.body;
      
      // Encrypt API keys
      const encryptedApiKey = authUtils.encryptData(binanceApiKey);
      const encryptedSecretKey = authUtils.encryptData(binanceSecretKey);
      
      // Update user's API keys
      const updatedUser = await User.updateApiKeys(userId, encryptedApiKey, encryptedSecretKey);
      
      res.status(200).json({
        status: 'success',
        message: 'API keys updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            created_at: updatedUser.created_at
          }
        }
      });
    } catch (error) {
      console.error('Update API keys error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update API keys'
      });
    }
  },

  /**
   * Get user's API keys
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getApiKeys: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user's API keys
      const apiKeys = await User.getApiKeys(userId);
      
      if (!apiKeys) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      // Decrypt API keys
      const decryptedApiKey = apiKeys.binance_api_key ? authUtils.decryptData(apiKeys.binance_api_key) : null;
      const decryptedSecretKey = apiKeys.binance_secret_key ? authUtils.decryptData(apiKeys.binance_secret_key) : null;
      
      res.status(200).json({
        status: 'success',
        data: {
          binanceApiKey: decryptedApiKey,
          binanceSecretKey: decryptedSecretKey
        }
      });
    } catch (error) {
      console.error('Get API keys error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get API keys'
      });
    }
  },

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user profile
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          }
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get user profile'
      });
    }
  }
};

module.exports = userController; 