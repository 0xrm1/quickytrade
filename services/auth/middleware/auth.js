/**
 * auth.js
 * 
 * Kimlik doğrulama middleware'i.
 * JWT token doğrulama ve yetkilendirme işlemlerini yönetir.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Kullanıcı kimliğini doğrula
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Token'ı header'dan al
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Token'ı cookie'den al
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Token yoksa hata döndür
    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'Bu kaynağa erişmek için giriş yapmalısınız'
      });
    }
    
    try {
      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quickytrade-secret');
      
      // Kullanıcıyı bul
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          error: true,
          message: 'Geçersiz token, kullanıcı bulunamadı'
        });
      }
      
      // Kullanıcı aktif değilse erişimi engelle
      if (!user.isActive) {
        return res.status(401).json({
          error: true,
          message: 'Hesabınız devre dışı bırakılmış'
        });
      }
      
      // Kullanıcıyı request'e ekle
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        error: true,
        message: 'Geçersiz token'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Rol bazlı yetkilendirme
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'Bu kaynağa erişmek için giriş yapmalısınız'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: true,
        message: 'Bu kaynağa erişmek için yetkiniz yok'
      });
    }
    
    next();
  };
}; 