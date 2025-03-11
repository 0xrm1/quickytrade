const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['refresh', 'access', 'reset', 'verification'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // Automatically delete documents after 30 days
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  }
});

// Create compound index for faster lookups
tokenSchema.index({ userId: 1, type: 1 });
tokenSchema.index({ token: 1 });
tokenSchema.index({ expiresAt: 1 });

/**
 * Check if token is expired
 */
tokenSchema.methods.isExpired = function() {
  return Date.now() >= this.expiresAt;
};

/**
 * Check if token is valid (not expired and not revoked)
 */
tokenSchema.methods.isValid = function() {
  return !this.isRevoked && !this.isExpired();
};

/**
 * Revoke token
 */
tokenSchema.methods.revoke = async function() {
  this.isRevoked = true;
  return this.save();
};

/**
 * Find valid token by userId and type
 */
tokenSchema.statics.findValidToken = async function(userId, type) {
  return this.findOne({
    userId,
    type,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });
};

/**
 * Revoke all tokens for a user
 */
tokenSchema.statics.revokeAllUserTokens = async function(userId, type = null) {
  const query = { userId, isRevoked: false };
  
  if (type) {
    query.type = type;
  }
  
  return this.updateMany(query, { isRevoked: true });
};

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token; 