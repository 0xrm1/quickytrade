const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Authentication utility functions
 */
const authUtils = {
  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  hashPassword: async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  },

  /**
   * Compare a password with a hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} - True if password matches hash
   */
  comparePassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },

  /**
   * Generate a JWT token
   * @param {Object} payload - Token payload
   * @returns {string} - JWT token
   */
  generateToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  },

  /**
   * Verify a JWT token
   * @param {string} token - JWT token
   * @returns {Object} - Decoded token payload
   */
  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  },

  /**
   * Encrypt data using AES
   * @param {string} data - Data to encrypt
   * @returns {string} - Encrypted data
   */
  encryptData: (data) => {
    if (!data) return null;
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  },

  /**
   * Decrypt data using AES
   * @param {string} encryptedData - Encrypted data
   * @returns {string} - Decrypted data
   */
  decryptData: (encryptedData) => {
    if (!encryptedData) return null;
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
};

module.exports = authUtils; 