/**
 * auth.js
 * 
 * Kimlik doğrulama kontrolcüsü.
 * Kullanıcı kaydı, girişi ve kimlik doğrulama işlemlerini yönetir.
 */

const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');

// @desc    Kullanıcı kaydı
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Kullanıcı zaten var mı kontrol et
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: 'Bu e-posta veya kullanıcı adı zaten kullanılıyor'
      });
    }
    
    // Kullanıcıyı oluştur
    const user = await User.create({
      username,
      email,
      password
    });
    
    // Token oluştur
    const token = user.generateAuthToken();
    
    res.status(201).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı girişi
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // E-posta ve şifre kontrolü
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Lütfen e-posta ve şifre girin'
      });
    }
    
    // Kullanıcıyı bul
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Geçersiz kimlik bilgileri'
      });
    }
    
    // Şifre doğrulama
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        error: true,
        message: 'Geçersiz kimlik bilgileri'
      });
    }
    
    // Son giriş tarihini güncelle
    user.lastLogin = Date.now();
    await user.save();
    
    // Token oluştur
    const token = user.generateAuthToken();
    
    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı çıkışı
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // JWT tabanlı kimlik doğrulamada çıkış işlemi client tarafında token'ı silmekle gerçekleşir
    // Burada sadece başarılı yanıt döndürüyoruz
    res.status(200).json({
      success: true,
      message: 'Başarıyla çıkış yapıldı'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mevcut kullanıcı bilgilerini getir
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı bilgilerini güncelle
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      username: req.body.username,
      email: req.body.email
    };
    
    // Sadece gönderilen alanları güncelle
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Şifre güncelleme
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Kullanıcıyı şifresiyle birlikte bul
    const user = await User.findById(req.user.id).select('+password');
    
    // Mevcut şifreyi kontrol et
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        error: true,
        message: 'Mevcut şifre yanlış'
      });
    }
    
    // Şifreyi güncelle
    user.password = newPassword;
    await user.save();
    
    // Yeni token oluştur
    const token = user.generateAuthToken();
    
    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Şifre sıfırlama e-postası gönder
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // E-posta ile kullanıcıyı bul
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı'
      });
    }
    
    // Sıfırlama token'ı oluştur
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    
    // Sıfırlama URL'si oluştur
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    // E-posta içeriği
    const message = `
      Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:
      \n\n${resetUrl}\n\n
      Bu bağlantı 10 dakika sonra geçersiz olacaktır.
      Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.
    `;
    
    try {
      // E-posta gönder
      await sendEmail({
        email: user.email,
        subject: 'Şifre Sıfırlama Talebi',
        message
      });
      
      res.status(200).json({
        success: true,
        message: 'Şifre sıfırlama e-postası gönderildi'
      });
    } catch (error) {
      // Hata durumunda token'ı sıfırla
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        error: true,
        message: 'E-posta gönderilemedi'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Şifre sıfırlama
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Token'ı hash'le
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');
    
    // Token'a sahip ve süresi geçmemiş kullanıcıyı bul
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        error: true,
        message: 'Geçersiz veya süresi dolmuş token'
      });
    }
    
    // Yeni şifreyi ayarla
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    // Token oluştur
    const token = user.generateAuthToken();
    
    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Token doğrulama
// @route   POST /api/auth/verify
// @access  Public
exports.verifyToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: true,
        message: 'Token gerekli'
      });
    }
    
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quickytrade-secret');
    
    // Kullanıcıyı kontrol et
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(401).json({
      error: true,
      message: 'Geçersiz token'
    });
  }
}; 