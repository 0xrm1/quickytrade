/**
 * index.js
 * 
 * API Gateway mikroservisi ana dosyası.
 * Diğer mikroservislere yönlendirme yapar ve istemci isteklerini yönetir.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const { setupWebSocket } = require('./websocket');

// Ortam değişkenlerini yükle
require('dotenv').config();

// Express uygulaması oluştur
const app = express();
const PORT = process.env.GATEWAY_PORT || 5000;

// Middleware'leri ayarla
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına 15 dakikada 100 istek
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin'
  }
});

// API istekleri için rate limiter uygula
app.use('/api', apiLimiter);

// Mikroservis URL'leri
const BINANCE_API_URL = process.env.BINANCE_API_URL || 'http://localhost:5001';
const AUTH_API_URL = process.env.AUTH_API_URL || 'http://localhost:5002';

// Binance API proxy
app.use('/api/binance', createProxyMiddleware({
  target: BINANCE_API_URL,
  pathRewrite: {
    '^/api/binance': '/api'
  },
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // İstek logları
    console.log(`[Binance API] ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Binance API Proxy Error]', err);
    res.status(500).json({
      error: true,
      message: 'Binance API servisine bağlanırken hata oluştu'
    });
  }
}));

// Auth API proxy
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_API_URL,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // İstek logları
    console.log(`[Auth API] ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Auth API Proxy Error]', err);
    res.status(500).json({
      error: true,
      message: 'Auth API servisine bağlanırken hata oluştu'
    });
  }
}));

// Kullanıcı yönetimi API proxy
app.use('/api/users', createProxyMiddleware({
  target: AUTH_API_URL,
  pathRewrite: {
    '^/api/users': '/api/users'
  },
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // İstek logları
    console.log(`[Users API] ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Users API Proxy Error]', err);
    res.status(500).json({
      error: true,
      message: 'Users API servisine bağlanırken hata oluştu'
    });
  }
}));

// Sağlık kontrolü
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'up',
    service: 'api-gateway',
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

// WebSocket sunucusunu kur
setupWebSocket(server);

// Sunucuyu başlat
server.listen(PORT, () => {
  console.log(`API Gateway ${PORT} portunda çalışıyor`);
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