/**
 * websocket.js
 * 
 * Bu dosya, sunucu tarafında WebSocket bağlantılarını yönetmek için bir servis sağlar.
 * WebSocket mesajlarını sıkıştırma ve açma işlemlerini destekler.
 */

const WebSocket = require('ws');
const pako = require('pako');
const http = require('http');
const url = require('url');

// Sıkıştırma seçenekleri
const COMPRESSION_OPTIONS = {
  NONE: 'none',
  GZIP: 'gzip',
  DEFLATE: 'deflate',
};

/**
 * Mesajı sıkıştırma
 * @param {string|object} message - Sıkıştırılacak mesaj
 * @param {string} compressionType - Sıkıştırma türü (COMPRESSION_OPTIONS)
 * @returns {Buffer|string} - Sıkıştırılmış mesaj
 */
const compressMessage = (message, compressionType = COMPRESSION_OPTIONS.GZIP) => {
  // Mesajı string'e dönüştür
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
  
  // Sıkıştırma türüne göre işlem yap
  switch (compressionType) {
    case COMPRESSION_OPTIONS.GZIP:
      return Buffer.from(pako.gzip(messageStr));
    case COMPRESSION_OPTIONS.DEFLATE:
      return Buffer.from(pako.deflate(messageStr));
    case COMPRESSION_OPTIONS.NONE:
    default:
      return messageStr;
  }
};

/**
 * Sıkıştırılmış mesajı açma
 * @param {Buffer|string} compressedMessage - Sıkıştırılmış mesaj
 * @param {string} compressionType - Sıkıştırma türü (COMPRESSION_OPTIONS)
 * @returns {string} - Açılmış mesaj
 */
const decompressMessage = (compressedMessage, compressionType = COMPRESSION_OPTIONS.GZIP) => {
  // Sıkıştırma türüne göre işlem yap
  switch (compressionType) {
    case COMPRESSION_OPTIONS.GZIP:
      return Buffer.isBuffer(compressedMessage)
        ? Buffer.from(pako.ungzip(compressedMessage)).toString()
        : compressedMessage;
    case COMPRESSION_OPTIONS.DEFLATE:
      return Buffer.isBuffer(compressedMessage)
        ? Buffer.from(pako.inflate(compressedMessage)).toString()
        : compressedMessage;
    case COMPRESSION_OPTIONS.NONE:
    default:
      return compressedMessage;
  }
};

/**
 * WebSocket sunucusu oluşturma
 * @param {http.Server} server - HTTP sunucusu
 * @param {Object} options - WebSocket sunucusu seçenekleri
 * @returns {WebSocket.Server} - WebSocket sunucusu
 */
const createWebSocketServer = (server, options = {}) => {
  const wss = new WebSocket.Server({
    server,
    ...options,
  });
  
  // Bağlantı olayı
  wss.on('connection', (ws, req) => {
    // URL'den sıkıştırma türünü al
    const { query } = url.parse(req.url, true);
    const compression = query.compression || COMPRESSION_OPTIONS.NONE;
    
    // WebSocket nesnesine sıkıştırma türünü ekle
    ws.compression = compression;
    
    // Mesaj olayı
    ws.on('message', (message) => {
      try {
        // Mesajı aç
        const decompressed = decompressMessage(message, ws.compression);
        
        // JSON parse
        const data = JSON.parse(decompressed);
        
        // Mesajı işle
        handleMessage(ws, data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    });
    
    // Hata olayı
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Kapatma olayı
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
    
    // Ping olayı
    ws.on('ping', (data) => {
      ws.pong(data);
    });
  });
  
  return wss;
};

/**
 * Mesaj işleme
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {Object} data - Mesaj verisi
 */
const handleMessage = (ws, data) => {
  // Mesaj türüne göre işlem yap
  switch (data.method) {
    case 'SUBSCRIBE':
      handleSubscribe(ws, data);
      break;
    case 'UNSUBSCRIBE':
      handleUnsubscribe(ws, data);
      break;
    default:
      // Diğer mesaj türleri
      break;
  }
};

/**
 * Abone olma işlemi
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {Object} data - Mesaj verisi
 */
const handleSubscribe = (ws, data) => {
  // Abonelik işlemleri
  console.log('Subscribe:', data.params);
  
  // Başarılı yanıt gönder
  sendMessage(ws, {
    result: null,
    id: data.id,
  });
};

/**
 * Abonelikten çıkma işlemi
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {Object} data - Mesaj verisi
 */
const handleUnsubscribe = (ws, data) => {
  // Abonelikten çıkma işlemleri
  console.log('Unsubscribe:', data.params);
  
  // Başarılı yanıt gönder
  sendMessage(ws, {
    result: null,
    id: data.id,
  });
};

/**
 * Mesaj gönderme
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {Object} data - Gönderilecek veri
 */
const sendMessage = (ws, data) => {
  if (ws.readyState === WebSocket.OPEN) {
    // Mesajı sıkıştır
    const compressed = ws.compression !== COMPRESSION_OPTIONS.NONE
      ? compressMessage(data, ws.compression)
      : JSON.stringify(data);
    
    // Mesajı gönder
    ws.send(compressed);
  }
};

/**
 * Tüm istemcilere mesaj gönderme
 * @param {WebSocket.Server} wss - WebSocket sunucusu
 * @param {Object} data - Gönderilecek veri
 * @param {Function} filter - Filtre fonksiyonu
 */
const broadcastMessage = (wss, data, filter = () => true) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && filter(client)) {
      sendMessage(client, data);
    }
  });
};

module.exports = {
  createWebSocketServer,
  sendMessage,
  broadcastMessage,
  compressMessage,
  decompressMessage,
  COMPRESSION_OPTIONS,
}; 