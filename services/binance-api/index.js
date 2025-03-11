/**
 * index.js
 * 
 * Binance API mikroservisi ana dosyası.
 * Bu mikroservis, Binance API ile iletişim kurar ve verileri önbelleğe alır.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createServer } = require('http');
const routes = require('./routes');
const { connectRedis } = require('../shared/redis');

// Ortam değişkenlerini yükle
require('dotenv').config();

// Express uygulaması oluştur
const app = express();
const server = createServer(app);

// Middleware'leri yapılandır
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// Redis'e bağlan
connectRedis()
  .then(() => console.log('Redis bağlantısı başarılı'))
  .catch((err) => console.error('Redis bağlantı hatası:', err));

// API rotalarını yapılandır
app.use('/api', routes);

// Sağlık kontrolü
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'up', service: 'binance-api' });
});

// Hata işleme middleware'i
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'Bir hata oluştu',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Sunucuyu başlat
const PORT = process.env.BINANCE_API_PORT || 5001;
server.listen(PORT, () => {
  console.log(`Binance API mikroservisi ${PORT} portunda çalışıyor`);
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

module.exports = server; 