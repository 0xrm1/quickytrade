/**
 * routes.js
 * 
 * Auth mikroservisi rotaları.
 * Kimlik doğrulama ve kullanıcı yönetimi için API rotalarını tanımlar.
 */

const express = require('express');
const { 
  register, 
  login, 
  logout, 
  getMe, 
  updateDetails, 
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyToken
} = require('./controllers/auth');
const { 
  getAllUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser 
} = require('./controllers/users');
const { protect, authorize } = require('./middleware/auth');

const router = express.Router();

// Auth rotaları
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', protect, getMe);
router.put('/auth/updatedetails', protect, updateDetails);
router.put('/auth/updatepassword', protect, updatePassword);
router.post('/auth/forgotpassword', forgotPassword);
router.put('/auth/resetpassword/:resettoken', resetPassword);
router.post('/auth/verify', verifyToken);

// Kullanıcı yönetimi rotaları (sadece admin)
router.route('/users')
  .get(protect, authorize('admin'), getAllUsers)
  .post(protect, authorize('admin'), createUser);

router.route('/users/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router; 