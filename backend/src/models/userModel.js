const db = require('../config/db');

/**
 * User model for database operations
 */
const User = {
  /**
   * Create a new user in the database
   * @param {Object} user - User object with email and password
   * @returns {Promise} - Promise resolving to the created user
   */
  create: async (user) => {
    const { email, password, binance_api_key = null, binance_secret_key = null } = user;
    
    const query = `
      INSERT INTO users (email, password, binance_api_key, binance_secret_key)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, created_at
    `;
    
    try {
      const result = await db.query(query, [email, password, binance_api_key, binance_secret_key]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise} - Promise resolving to the found user or null
   */
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    
    try {
      const result = await db.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Promise} - Promise resolving to the found user or null
   */
  findById: async (id) => {
    const query = 'SELECT id, email, created_at FROM users WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user's API keys
   * @param {number} userId - User ID
   * @param {string} binanceApiKey - Encrypted Binance API key
   * @param {string} binanceSecretKey - Encrypted Binance Secret key
   * @returns {Promise} - Promise resolving to the updated user
   */
  updateApiKeys: async (userId, binanceApiKey, binanceSecretKey) => {
    const query = `
      UPDATE users
      SET binance_api_key = $2, binance_secret_key = $3
      WHERE id = $1
      RETURNING id, email, created_at
    `;
    
    try {
      const result = await db.query(query, [userId, binanceApiKey, binanceSecretKey]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user's API keys
   * @param {number} userId - User ID
   * @returns {Promise} - Promise resolving to the user's API keys
   */
  getApiKeys: async (userId) => {
    const query = 'SELECT binance_api_key, binance_secret_key FROM users WHERE id = $1';
    
    try {
      const result = await db.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = User; 