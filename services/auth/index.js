/**
 * index.js
 * 
 * Auth mikroservisi ana dosyası.
 * Bu mikroservis, kullanıcı kimlik doğrulama ve yetkilendirme işlemlerini yönetir.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./db');
const routes = require('./routes');

// Ortam değişkenlerini yükle
require('dotenv').config();

// Express uygulaması oluştur
const app = express();
const PORT = process.env.AUTH_PORT || 5002;

// Middleware'leri ayarla
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Veritabanına bağlan
connectDB()
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// API rotalarını ayarla
app.use('/api', routes);

// Sağlık kontrolü
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'up',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// Hata işleme middleware'i
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Sunucu hatası'
  });
});

// HTTP sunucusu oluştur
const server = http.createServer(app);

// Sunucuyu başlat
server.listen(PORT, () => {
  console.log(`Auth servisi ${PORT} portunda çalışıyor`);
  console.log(`Sağlık kontrolü: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM sinyali alındı, sunucu kapatılıyor...');
  server.close(() => {
    console.log('Sunucu kapatıldı');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT sinyali alındı, sunucu kapatılıyor...');
  server.close(() => {
    console.log('Sunucu kapatıldı');
    process.exit(0);
  });
}); 