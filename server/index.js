/**
 * index.js
 * 
 * Bu dosya, sunucu uygulamasının ana giriş noktasıdır.
 * Express, WebSocket ve GraphQL sunucularını başlatır.
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { createWebSocketServer } = require('./websocket');
const { startGraphQLServer } = require('./graphql');
const redis = require('./redis');

// Ortam değişkenleri
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Express uygulaması oluşturma
const app = express();
const httpServer = http.createServer(app);

// Middleware'ler
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Sağlık kontrolü
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// Redis bağlantısı
const initRedis = async () => {
  try {
    await redis.initRedis(REDIS_URL);
    console.log('✅ Redis bağlantısı başarılı');
  } catch (error) {
    console.error('❌ Redis bağlantı hatası:', error);
  }
};

// WebSocket sunucusu
const initWebSocket = () => {
  const wsServer = createWebSocketServer(httpServer, {
    path: '/ws',
    compression: 'GZIP',
  });
  
  console.log('✅ WebSocket sunucusu başlatıldı');
  return wsServer;
};

// GraphQL sunucusu
const initGraphQL = async () => {
  try {
    const server = await startGraphQLServer(app, httpServer, '/graphql');
    console.log('✅ GraphQL sunucusu başlatıldı');
    return server;
  } catch (error) {
    console.error('❌ GraphQL sunucusu başlatılamadı:', error);
    throw error;
  }
};

// Sunucuyu başlatma
const startServer = async () => {
  try {
    // Redis bağlantısı
    await initRedis();
    
    // WebSocket sunucusu
    const wsServer = initWebSocket();
    
    // GraphQL sunucusu
    const graphqlServer = await initGraphQL();
    
    // HTTP sunucusu
    httpServer.listen(PORT, () => {
      console.log(`
🚀 Sunucu başlatıldı!
📡 HTTP: http://localhost:${PORT}
🔌 WebSocket: ws://localhost:${PORT}/ws
🧠 GraphQL: http://localhost:${PORT}/graphql
🌍 Ortam: ${NODE_ENV}
      `);
    });
    
    // Kapatma işleyicileri
    const shutdown = async () => {
      console.log('🛑 Sunucu kapatılıyor...');
      
      // GraphQL sunucusu
      await graphqlServer.stop();
      
      // WebSocket sunucusu
      wsServer.close();
      
      // Redis bağlantısı
      await redis.closeRedis();
      
      // HTTP sunucusu
      httpServer.close(() => {
        console.log('👋 Sunucu kapatıldı');
        process.exit(0);
      });
      
      // Zorla kapatma
      setTimeout(() => {
        console.error('⚠️ Zorla kapatılıyor');
        process.exit(1);
      }, 5000);
    };
    
    // Kapatma sinyalleri
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    return {
      app,
      httpServer,
      wsServer,
      graphqlServer,
    };
  } catch (error) {
    console.error('❌ Sunucu başlatılamadı:', error);
    process.exit(1);
  }
};

// Doğrudan çalıştırılırsa sunucuyu başlat
if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
}; 