/**
 * users.js
 * 
 * Kullanıcı yönetimi kontrolcüsü.
 * Admin kullanıcıların diğer kullanıcıları yönetmesi için API işlevlerini sağlar.
 */

const User = require('../models/User');

// @desc    Tüm kullanıcıları getir
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    // Sayfalama parametreleri
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filtreleme parametreleri
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    
    // Toplam kullanıcı sayısı
    const total = await User.countDocuments(filter);
    
    // Kullanıcıları getir
    const users = await User.find(filter)
      .select('-password')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Sayfalama bilgisi
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
    
    res.status(200).json({
      success: true,
      pagination,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tek kullanıcı getir
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı oluştur
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    
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
      password,
      role: role || 'user'
    });
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı güncelle
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { username, email, password, role, isActive, preferences } = req.body;
    
    // Güncellenecek alanları belirle
    const fieldsToUpdate = {};
    
    if (username !== undefined) fieldsToUpdate.username = username;
    if (email !== undefined) fieldsToUpdate.email = email;
    if (role !== undefined) fieldsToUpdate.role = role;
    if (isActive !== undefined) fieldsToUpdate.isActive = isActive;
    if (preferences !== undefined) fieldsToUpdate.preferences = preferences;
    
    // Kullanıcıyı güncelle
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Şifre güncellemesi ayrı işlenir
    if (password) {
      user.password = password;
      await user.save();
    }
    
    // Diğer alanları güncelle
    if (Object.keys(fieldsToUpdate).length > 0) {
      user = await User.findByIdAndUpdate(
        req.params.id,
        fieldsToUpdate,
        {
          new: true,
          runValidators: true
        }
      );
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı sil
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcıyı sil
    await user.remove();
    
    res.status(200).json({
      success: true,
      message: 'Kullanıcı silindi'
    });
  } catch (error) {
    next(error);
  }
}; 