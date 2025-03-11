/**
 * websocket.js
 * 
 * WebSocket sunucusu modülü.
 * Gerçek zamanlı veri akışını yönetir ve istemcilere iletir.
 */

const WebSocket = require('ws');
const axios = require('axios');
const pako = require('pako');
const Redis = require('ioredis');

// Redis bağlantısı
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Binance WebSocket URL'si
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

// WebSocket sunucusu
let wss;

// Aktif bağlantılar
const connections = new Map();

// Aktif abonelikler
const subscriptions = new Map();

// Binance WebSocket bağlantısı
let binanceWs;

// Eşik değerleri
const thresholds = {
  percentageThreshold: 0.5, // %0.5 değişim
  absoluteThreshold: 10,    // 10 birim değişim
  timeThreshold: 60         // 60 saniye
};

// Son fiyatlar
const lastPrices = new Map();

/**
 * WebSocket sunucusunu kur
 * @param {http.Server} server - HTTP sunucusu
 */
exports.setupWebSocket = (server) => {
  // WebSocket sunucusu oluştur
  wss = new WebSocket.Server({ server });
  
  // Bağlantı olayını dinle
  wss.on('connection', handleConnection);
  
  // Binance WebSocket bağlantısını başlat
  connectToBinance();
  
  console.log('WebSocket sunucusu başlatıldı');
  
  // Redis'ten eşik değerlerini yükle
  loadThresholds();
  
  // Redis'ten eşik değeri değişikliklerini dinle
  redis.subscribe('thresholds:update');
  redis.on('message', (channel, message) => {
    if (channel === 'thresholds:update') {
      try {
        const newThresholds = JSON.parse(message);
        Object.assign(thresholds, newThresholds);
        console.log('Eşik değerleri güncellendi:', thresholds);
      } catch (error) {
        console.error('Eşik değerleri güncellenirken hata:', error);
      }
    }
  });
};

/**
 * Eşik değerlerini Redis'ten yükle
 */
async function loadThresholds() {
  try {
    const thresholdsData = await redis.get('price:thresholds');
    if (thresholdsData) {
      Object.assign(thresholds, JSON.parse(thresholdsData));
      console.log('Eşik değerleri yüklendi:', thresholds);
    }
  } catch (error) {
    console.error('Eşik değerleri yüklenirken hata:', error);
  }
}

/**
 * Binance WebSocket'e bağlan
 */
function connectToBinance() {
  // Mevcut bağlantıyı kapat
  if (binanceWs) {
    binanceWs.terminate();
  }
  
  // Yeni bağlantı oluştur
  binanceWs = new WebSocket(BINANCE_WS_URL);
  
  // Bağlantı olaylarını dinle
  binanceWs.on('open', () => {
    console.log('Binance WebSocket bağlantısı açıldı');
    
    // Aktif abonelikleri yeniden abone ol
    if (subscriptions.size > 0) {
      const streams = Array.from(subscriptions.keys());
      subscribeToStreams(streams);
    }
  });
  
  binanceWs.on('message', handleBinanceMessage);
  
  binanceWs.on('error', (error) => {
    console.error('Binance WebSocket hatası:', error);
  });
  
  binanceWs.on('close', () => {
    console.log('Binance WebSocket bağlantısı kapandı, yeniden bağlanılıyor...');
    setTimeout(connectToBinance, 5000);
  });
}

/**
 * Yeni bağlantıyı işle
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {http.IncomingMessage} req - HTTP isteği
 */
function handleConnection(ws, req) {
  const clientId = Date.now().toString();
  connections.set(clientId, { ws, subscriptions: new Set() });
  
  console.log(`Yeni istemci bağlandı: ${clientId}`);
  
  // İstemci mesajlarını dinle
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(clientId, data);
    } catch (error) {
      console.error(`İstemci mesajı işlenirken hata: ${error.message}`);
      sendErrorToClient(ws, 'Geçersiz mesaj formatı');
    }
  });
  
  // Bağlantı kapandığında
  ws.on('close', () => {
    console.log(`İstemci bağlantısı kapandı: ${clientId}`);
    
    // İstemci aboneliklerini kaldır
    const client = connections.get(clientId);
    if (client) {
      client.subscriptions.forEach(stream => {
        const subs = subscriptions.get(stream);
        if (subs) {
          subs.delete(clientId);
          if (subs.size === 0) {
            subscriptions.delete(stream);
            unsubscribeFromStream(stream);
          }
        }
      });
    }
    
    // İstemciyi kaldır
    connections.delete(clientId);
  });
  
  // Ping-pong mekanizması
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);
  
  // Hoş geldin mesajı gönder
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'QuickyTrade WebSocket sunucusuna hoş geldiniz',
    clientId
  }));
}

/**
 * İstemci mesajını işle
 * @param {string} clientId - İstemci ID'si
 * @param {Object} data - Mesaj verisi
 */
function handleClientMessage(clientId, data) {
  const client = connections.get(clientId);
  if (!client) return;
  
  const { type, payload } = data;
  
  switch (type) {
    case 'subscribe':
      handleSubscribe(clientId, payload);
      break;
    case 'unsubscribe':
      handleUnsubscribe(clientId, payload);
      break;
    case 'ping':
      sendToClient(client.ws, { type: 'pong', timestamp: Date.now() });
      break;
    default:
      sendErrorToClient(client.ws, 'Bilinmeyen mesaj tipi');
  }
}

/**
 * Abone olma isteğini işle
 * @param {string} clientId - İstemci ID'si
 * @param {Object} payload - İstek verisi
 */
function handleSubscribe(clientId, payload) {
  const client = connections.get(clientId);
  if (!client) return;
  
  const { streams } = payload;
  if (!Array.isArray(streams) || streams.length === 0) {
    return sendErrorToClient(client.ws, 'Geçersiz stream listesi');
  }
  
  // Her stream için abone ol
  streams.forEach(stream => {
    // İstemci aboneliklerine ekle
    client.subscriptions.add(stream);
    
    // Genel aboneliklere ekle
    if (!subscriptions.has(stream)) {
      subscriptions.set(stream, new Set());
    }
    subscriptions.get(stream).add(clientId);
    
    // Binance'a abone ol
    if (subscriptions.get(stream).size === 1) {
      subscribeToStream(stream);
    }
  });
  
  // Başarılı yanıt gönder
  sendToClient(client.ws, {
    type: 'subscribed',
    streams
  });
}

/**
 * Abonelik iptal isteğini işle
 * @param {string} clientId - İstemci ID'si
 * @param {Object} payload - İstek verisi
 */
function handleUnsubscribe(clientId, payload) {
  const client = connections.get(clientId);
  if (!client) return;
  
  const { streams } = payload;
  if (!Array.isArray(streams) || streams.length === 0) {
    return sendErrorToClient(client.ws, 'Geçersiz stream listesi');
  }
  
  // Her stream için aboneliği iptal et
  streams.forEach(stream => {
    // İstemci aboneliklerinden kaldır
    client.subscriptions.delete(stream);
    
    // Genel aboneliklerden kaldır
    if (subscriptions.has(stream)) {
      subscriptions.get(stream).delete(clientId);
      
      // Hiç abone kalmadıysa Binance aboneliğini iptal et
      if (subscriptions.get(stream).size === 0) {
        subscriptions.delete(stream);
        unsubscribeFromStream(stream);
      }
    }
  });
  
  // Başarılı yanıt gönder
  sendToClient(client.ws, {
    type: 'unsubscribed',
    streams
  });
}

/**
 * Binance'a stream aboneliği gönder
 * @param {string} stream - Stream adı
 */
function subscribeToStream(stream) {
  if (binanceWs && binanceWs.readyState === WebSocket.OPEN) {
    const message = {
      method: 'SUBSCRIBE',
      params: [stream],
      id: Date.now()
    };
    
    binanceWs.send(JSON.stringify(message));
    console.log(`Stream'e abone olundu: ${stream}`);
  }
}

/**
 * Birden fazla stream'e abone ol
 * @param {Array<string>} streams - Stream listesi
 */
function subscribeToStreams(streams) {
  if (binanceWs && binanceWs.readyState === WebSocket.OPEN) {
    const message = {
      method: 'SUBSCRIBE',
      params: streams,
      id: Date.now()
    };
    
    binanceWs.send(JSON.stringify(message));
    console.log(`Stream'lere abone olundu: ${streams.join(', ')}`);
  }
}

/**
 * Binance stream aboneliğini iptal et
 * @param {string} stream - Stream adı
 */
function unsubscribeFromStream(stream) {
  if (binanceWs && binanceWs.readyState === WebSocket.OPEN) {
    const message = {
      method: 'UNSUBSCRIBE',
      params: [stream],
      id: Date.now()
    };
    
    binanceWs.send(JSON.stringify(message));
    console.log(`Stream aboneliği iptal edildi: ${stream}`);
  }
}

/**
 * Binance mesajını işle
 * @param {Buffer} data - Mesaj verisi
 */
function handleBinanceMessage(data) {
  try {
    const message = JSON.parse(data.toString());
    
    // Abonelik yanıtı
    if (message.id) {
      console.log(`Binance yanıtı: ${JSON.stringify(message)}`);
      return;
    }
    
    // Stream verisi
    if (message.stream) {
      const { stream, data: streamData } = message;
      
      // Fiyat değişimini kontrol et
      if (stream.includes('@ticker') || stream.includes('@kline')) {
        const symbol = stream.split('@')[0].toUpperCase();
        const currentPrice = streamData.c || (streamData.k && streamData.k.c);
        
        if (currentPrice && shouldUpdatePrice(symbol, currentPrice)) {
          // Fiyatı güncelle
          lastPrices.set(symbol, {
            price: currentPrice,
            timestamp: Date.now()
          });
          
          // Abonelere gönder
          broadcastToSubscribers(stream, streamData);
          
          // Redis'e kaydet
          cachePrice(symbol, streamData);
        }
      } else {
        // Diğer stream verilerini doğrudan gönder
        broadcastToSubscribers(stream, streamData);
      }
    }
  } catch (error) {
    console.error('Binance mesajı işlenirken hata:', error);
  }
}

/**
 * Fiyat güncellemesi gerekip gerekmediğini kontrol et
 * @param {string} symbol - Sembol
 * @param {string} currentPrice - Güncel fiyat
 * @returns {boolean} - Güncelleme gerekiyorsa true
 */
function shouldUpdatePrice(symbol, currentPrice) {
  const lastPriceData = lastPrices.get(symbol);
  if (!lastPriceData) return true;
  
  const lastPrice = parseFloat(lastPriceData.price);
  const newPrice = parseFloat(currentPrice);
  
  if (lastPrice === 0) return true;
  
  // Mutlak değişim
  const absoluteChange = Math.abs(newPrice - lastPrice);
  if (absoluteChange >= thresholds.absoluteThreshold) {
    return true;
  }
  
  // Yüzde değişim
  const percentageChange = (absoluteChange / lastPrice) * 100;
  if (percentageChange >= thresholds.percentageThreshold) {
    return true;
  }
  
  // Zaman kontrolü
  const timeDiff = Date.now() - lastPriceData.timestamp;
  if (timeDiff >= thresholds.timeThreshold * 1000) {
    return true;
  }
  
  return false;
}

/**
 * Fiyatı Redis'e kaydet
 * @param {string} symbol - Sembol
 * @param {Object} data - Fiyat verisi
 */
async function cachePrice(symbol, data) {
  try {
    const key = `price:ticker:${symbol}`;
    const value = JSON.stringify({
      ...data,
      timestamp: Date.now()
    });
    
    await redis.set(key, value, 'EX', 3600);
  } catch (error) {
    console.error(`Fiyat önbelleğe kaydedilirken hata: ${error.message}`);
  }
}

/**
 * Stream abonelerine veri gönder
 * @param {string} stream - Stream adı
 * @param {Object} data - Gönderilecek veri
 */
function broadcastToSubscribers(stream, data) {
  const subscribers = subscriptions.get(stream);
  if (!subscribers || subscribers.size === 0) return;
  
  const message = {
    type: 'stream',
    stream,
    data
  };
  
  const compressedMessage = compressData(message);
  
  subscribers.forEach(clientId => {
    const client = connections.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(compressedMessage);
    }
  });
}

/**
 * Veriyi sıkıştır
 * @param {Object} data - Sıkıştırılacak veri
 * @returns {Buffer} - Sıkıştırılmış veri
 */
function compressData(data) {
  const jsonStr = JSON.stringify(data);
  const compressed = pako.deflate(jsonStr);
  return Buffer.from(compressed);
}

/**
 * İstemciye mesaj gönder
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {Object} data - Gönderilecek veri
 */
function sendToClient(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

/**
 * İstemciye hata mesajı gönder
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {string} message - Hata mesajı
 */
function sendErrorToClient(ws, message) {
  sendToClient(ws, {
    type: 'error',
    message
  });
} 