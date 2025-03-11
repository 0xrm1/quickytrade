/**
 * User.js
 * 
 * Kullanıcı modeli.
 * Kullanıcı verilerini ve kimlik doğrulama işlemlerini yönetir.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Kullanıcı şeması
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Kullanıcı adı gerekli'],
    unique: true,
    trim: true,
    minlength: [3, 'Kullanıcı adı en az 3 karakter olmalı'],
    maxlength: [30, 'Kullanıcı adı en fazla 30 karakter olabilir']
  },
  email: {
    type: String,
    required: [true, 'E-posta adresi gerekli'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir e-posta adresi girin']
  },
  password: {
    type: String,
    required: [true, 'Şifre gerekli'],
    minlength: [6, 'Şifre en az 6 karakter olmalı'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    favoriteSymbols: [{
      type: String,
      trim: true
    }],
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Şifreyi kaydetmeden önce hash'le
userSchema.pre('save', async function(next) {
  // Şifre değişmediyse hash'leme
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Güncelleme tarihini otomatik ayarla
userSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

// Şifre doğrulama metodu
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// JWT token oluşturma metodu
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, username: this.username, role: this.role },
    process.env.JWT_SECRET || 'quickytrade-secret',
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

// Şifre sıfırlama token'ı oluşturma metodu
userSchema.methods.generateResetPasswordToken = function() {
  // Rastgele token oluştur
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Token'ı hash'le ve kullanıcıya kaydet
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Token'ın geçerlilik süresini ayarla (10 dakika)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Kullanıcı modelini oluştur
const User = mongoose.model('User', userSchema);

module.exports = User; 