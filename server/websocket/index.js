/**
 * websocket/index.js
 * 
 * Bu modül, WebSocket sunucusunu yönetir ve gerçek zamanlı veri akışını sağlar.
 * Optimize edilmiş WebSocket bağlantıları ve mesaj işleme mekanizmaları içerir.
 */

const WebSocket = require('ws');
const { getRedisClient } = require('../redis');
const { updatePriceWithThreshold, updateTickerWithThreshold } = require('../services/priceCache');

// Aktif bağlantıları ve abonelikleri takip etmek için
const connections = new Map();
const subscriptions = new Map();

// Mesaj tipleri
const MESSAGE_TYPES = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  PRICE_UPDATE: 'price_update',
  TICKER_UPDATE: 'ticker_update',
  DEPTH_UPDATE: 'depth_update',
  KLINE_UPDATE: 'kline_update',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
};

/**
 * WebSocket sunucusu oluşturur
 * @param {http.Server} server - HTTP sunucusu
 * @param {Object} options - WebSocket sunucu seçenekleri
 * @returns {WebSocket.Server} - WebSocket sunucusu
 */
const createWebSocketServer = (server, options = {}) => {
  const wss = new WebSocket.Server({
    server,
    path: options.path || '/ws',
    perMessageDeflate: options.compression === 'GZIP',
    clientTracking: true,
    maxPayload: 1024 * 1024, // 1MB
    ...options,
  });

  // Bağlantı olayını dinle
  wss.on('connection', handleConnection);

  // Hata olayını dinle
  wss.on('error', (error) => {
    console.error('WebSocket sunucu hatası:', error);
  });

  // Periyodik olarak bağlantıları kontrol et
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.isAlive === false) {
        // Yanıt vermeyen istemciyi kapat
        const clientId = getClientId(client);
        handleDisconnect(client, clientId);
        return client.terminate();
      }

      // İstemciyi ölü olarak işaretle ve ping gönder
      client.isAlive = false;
      client.ping(() => {});
    });
  }, 30000); // 30 saniyede bir

  // Sunucu kapandığında interval'i temizle
  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  return wss;
};

/**
 * Yeni bir WebSocket bağlantısını işler
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {http.IncomingMessage} req - HTTP isteği
 */
const handleConnection = (ws, req) => {
  // İstemci bilgilerini al
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const clientId = generateClientId();
  
  // İstemci bilgilerini kaydet
  ws.clientId = clientId;
  ws.isAlive = true;
  ws.subscriptions = new Set();
  
  // Bağlantıyı kaydet
  connections.set(clientId, {
    ws,
    ip,
    connectedAt: new Date(),
    lastActivity: new Date(),
  });
  
  console.log(`WebSocket bağlantısı: ${clientId} (${ip})`);
  
  // Pong mesajını dinle (ping yanıtı)
  ws.on('pong', () => {
    ws.isAlive = true;
    updateClientActivity(clientId);
  });
  
  // Mesajları dinle
  ws.on('message', (message) => handleMessage(ws, message, clientId));
  
  // Bağlantı kapandığında
  ws.on('close', () => handleDisconnect(ws, clientId));
  
  // Hata durumunda
  ws.on('error', (error) => {
    console.error(`WebSocket istemci hatası (${clientId}):`, error);
  });
  
  // Hoş geldin mesajı gönder
  sendMessage(ws, {
    type: 'welcome',
    clientId,
    timestamp: Date.now(),
    message: 'WebSocket bağlantısı başarılı',
  });
};

/**
 * WebSocket mesajını işler
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {string|Buffer} rawMessage - Ham mesaj
 * @param {string} clientId - İstemci ID'si
 */
const handleMessage = (ws, rawMessage, clientId) => {
  updateClientActivity(clientId);
  
  let message;
  try {
    // Mesajı JSON olarak ayrıştır
    const messageStr = rawMessage.toString();
    message = JSON.parse(messageStr);
  } catch (error) {
    return sendError(ws, 'Geçersiz mesaj formatı. JSON bekleniyor.');
  }
  
  // Mesaj tipine göre işle
  switch (message.type) {
    case MESSAGE_TYPES.SUBSCRIBE:
      handleSubscribe(ws, message, clientId);
      break;
      
    case MESSAGE_TYPES.UNSUBSCRIBE:
      handleUnsubscribe(ws, message, clientId);
      break;
      
    case MESSAGE_TYPES.PING:
      sendMessage(ws, { type: MESSAGE_TYPES.PONG, timestamp: Date.now() });
      break;
      
    default:
      sendError(ws, `Bilinmeyen mesaj tipi: ${message.type}`);
  }
};

/**
 * Abone olma isteğini işler
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {Object} message - Mesaj nesnesi
 * @param {string} clientId - İstemci ID'si
 */
const handleSubscribe = (ws, message, clientId) => {
  const { channel, symbol, interval } = message;
  
  if (!channel) {
    return sendError(ws, 'Kanal belirtilmedi');
  }
  
  // Kanal formatını oluştur
  let channelKey = channel;
  if (symbol) {
    channelKey += `:${symbol}`;
    if (interval && (channel === 'kline' || channel === 'candle')) {
      channelKey += `:${interval}`;
    }
  }
  
  // Aboneliği kaydet
  ws.subscriptions.add(channelKey);
  
  // Kanal aboneliklerini güncelle
  if (!subscriptions.has(channelKey)) {
    subscriptions.set(channelKey, new Set());
  }
  subscriptions.get(channelKey).add(clientId);
  
  console.log(`Abone olundu: ${clientId} -> ${channelKey}`);
  
  // Başarılı yanıt gönder
  sendMessage(ws, {
    type: 'subscribed',
    channel: channelKey,
    timestamp: Date.now(),
  });
};

/**
 * Abonelikten çıkma isteğini işler
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {Object} message - Mesaj nesnesi
 * @param {string} clientId - İstemci ID'si
 */
const handleUnsubscribe = (ws, message, clientId) => {
  const { channel, symbol, interval, all } = message;
  
  // Tüm aboneliklerden çık
  if (all) {
    // İstemcinin tüm aboneliklerini temizle
    for (const channelKey of ws.subscriptions) {
      if (subscriptions.has(channelKey)) {
        subscriptions.get(channelKey).delete(clientId);
      }
    }
    ws.subscriptions.clear();
    
    return sendMessage(ws, {
      type: 'unsubscribed',
      all: true,
      timestamp: Date.now(),
    });
  }
  
  if (!channel) {
    return sendError(ws, 'Kanal belirtilmedi');
  }
  
  // Kanal formatını oluştur
  let channelKey = channel;
  if (symbol) {
    channelKey += `:${symbol}`;
    if (interval && (channel === 'kline' || channel === 'candle')) {
      channelKey += `:${interval}`;
    }
  }
  
  // Aboneliği kaldır
  ws.subscriptions.delete(channelKey);
  
  // Kanal aboneliklerini güncelle
  if (subscriptions.has(channelKey)) {
    subscriptions.get(channelKey).delete(clientId);
  }
  
  console.log(`Abonelikten çıkıldı: ${clientId} -> ${channelKey}`);
  
  // Başarılı yanıt gönder
  sendMessage(ws, {
    type: 'unsubscribed',
    channel: channelKey,
    timestamp: Date.now(),
  });
};

/**
 * Bağlantı kapandığında işler
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {string} clientId - İstemci ID'si
 */
const handleDisconnect = (ws, clientId) => {
  // İstemcinin tüm aboneliklerini temizle
  for (const channelKey of ws.subscriptions || []) {
    if (subscriptions.has(channelKey)) {
      subscriptions.get(channelKey).delete(clientId);
    }
  }
  
  // Bağlantıyı kaldır
  connections.delete(clientId);
  
  console.log(`WebSocket bağlantısı kapandı: ${clientId}`);
};

/**
 * Fiyat güncellemesini tüm abonelere yayınlar
 * @param {string} symbol - Sembol
 * @param {Object} priceData - Fiyat verisi
 * @returns {number} - Mesaj gönderilen istemci sayısı
 */
const broadcastPriceUpdate = (symbol, priceData) => {
  const channelKey = `price:${symbol}`;
  return broadcastToChannel(channelKey, {
    type: MESSAGE_TYPES.PRICE_UPDATE,
    symbol,
    data: priceData,
    timestamp: Date.now(),
  });
};

/**
 * Ticker güncellemesini tüm abonelere yayınlar
 * @param {string} symbol - Sembol
 * @param {Object} tickerData - Ticker verisi
 * @returns {number} - Mesaj gönderilen istemci sayısı
 */
const broadcastTickerUpdate = (symbol, tickerData) => {
  const channelKey = `ticker:${symbol}`;
  return broadcastToChannel(channelKey, {
    type: MESSAGE_TYPES.TICKER_UPDATE,
    symbol,
    data: tickerData,
    timestamp: Date.now(),
  });
};

/**
 * Derinlik güncellemesini tüm abonelere yayınlar
 * @param {string} symbol - Sembol
 * @param {Object} depthData - Derinlik verisi
 * @returns {number} - Mesaj gönderilen istemci sayısı
 */
const broadcastDepthUpdate = (symbol, depthData) => {
  const channelKey = `depth:${symbol}`;
  return broadcastToChannel(channelKey, {
    type: MESSAGE_TYPES.DEPTH_UPDATE,
    symbol,
    data: depthData,
    timestamp: Date.now(),
  });
};

/**
 * Kline güncellemesini tüm abonelere yayınlar
 * @param {string} symbol - Sembol
 * @param {string} interval - Zaman aralığı
 * @param {Object} klineData - Kline verisi
 * @returns {number} - Mesaj gönderilen istemci sayısı
 */
const broadcastKlineUpdate = (symbol, interval, klineData) => {
  const channelKey = `kline:${symbol}:${interval}`;
  return broadcastToChannel(channelKey, {
    type: MESSAGE_TYPES.KLINE_UPDATE,
    symbol,
    interval,
    data: klineData,
    timestamp: Date.now(),
  });
};

/**
 * Belirli bir kanala mesaj yayınlar
 * @param {string} channelKey - Kanal anahtarı
 * @param {Object} message - Mesaj nesnesi
 * @returns {number} - Mesaj gönderilen istemci sayısı
 */
const broadcastToChannel = (channelKey, message) => {
  if (!subscriptions.has(channelKey)) {
    return 0;
  }
  
  const subscribers = subscriptions.get(channelKey);
  let sentCount = 0;
  
  for (const clientId of subscribers) {
    const connection = connections.get(clientId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      sendMessage(connection.ws, message);
      sentCount++;
    }
  }
  
  return sentCount;
};

/**
 * WebSocket üzerinden mesaj gönderir
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {Object} message - Mesaj nesnesi
 * @returns {boolean} - Başarılı ise true
 */
const sendMessage = (ws, message) => {
  if (ws.readyState !== WebSocket.OPEN) {
    return false;
  }
  
  try {
    const messageStr = JSON.stringify(message);
    ws.send(messageStr);
    return true;
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    return false;
  }
};

/**
 * Hata mesajı gönderir
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @param {string} errorMessage - Hata mesajı
 * @returns {boolean} - Başarılı ise true
 */
const sendError = (ws, errorMessage) => {
  return sendMessage(ws, {
    type: MESSAGE_TYPES.ERROR,
    message: errorMessage,
    timestamp: Date.now(),
  });
};

/**
 * İstemci aktivitesini günceller
 * @param {string} clientId - İstemci ID'si
 */
const updateClientActivity = (clientId) => {
  const connection = connections.get(clientId);
  if (connection) {
    connection.lastActivity = new Date();
  }
};

/**
 * Benzersiz istemci ID'si oluşturur
 * @returns {string} - İstemci ID'si
 */
const generateClientId = () => {
  return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * İstemci ID'sini alır
 * @param {WebSocket} ws - WebSocket bağlantısı
 * @returns {string|null} - İstemci ID'si
 */
const getClientId = (ws) => {
  return ws.clientId || null;
};

/**
 * Binance WebSocket verilerini işler ve Redis'e kaydeder
 * @param {Object} data - Binance WebSocket verisi
 * @returns {Promise<boolean>} - Başarılı ise true
 */
const processBinanceWebSocketData = async (data) => {
  try {
    if (!data || !data.e) {
      return false;
    }
    
    const redis = getRedisClient();
    if (!redis) {
      console.warn('Redis istemcisi bulunamadı, veri işlenemedi');
      return false;
    }
    
    // Veri tipine göre işle
    switch (data.e) {
      case '24hrTicker': {
        // Ticker verisi
        const symbol = data.s;
        const tickerData = {
          symbol,
          priceChange: data.p,
          priceChangePercent: data.P,
          lastPrice: data.c,
          openPrice: data.o,
          highPrice: data.h,
          lowPrice: data.l,
          volume: data.v,
          quoteVolume: data.q,
          openTime: data.O,
          closeTime: data.C,
          count: data.n,
        };
        
        // Redis'e kaydet ve eşik değerine göre güncelle
        const updated = await updateTickerWithThreshold(symbol, tickerData);
        
        // Eşik değeri aşıldıysa WebSocket üzerinden yayınla
        if (updated) {
          broadcastTickerUpdate(symbol, tickerData);
        }
        
        return true;
      }
      
      case 'trade': {
        // İşlem verisi
        const symbol = data.s;
        const price = parseFloat(data.p);
        
        // Redis'e kaydet ve eşik değerine göre güncelle
        const updated = await updatePriceWithThreshold(symbol, price);
        
        // Eşik değeri aşıldıysa WebSocket üzerinden yayınla
        if (updated) {
          broadcastPriceUpdate(symbol, { price });
        }
        
        return true;
      }
      
      case 'depthUpdate': {
        // Derinlik verisi
        const symbol = data.s;
        const depthData = {
          symbol,
          firstUpdateId: data.U,
          finalUpdateId: data.u,
          bids: data.b,
          asks: data.a,
        };
        
        // WebSocket üzerinden yayınla
        broadcastDepthUpdate(symbol, depthData);
        
        return true;
      }
      
      case 'kline': {
        // Kline verisi
        const symbol = data.s;
        const interval = data.k.i;
        const klineData = {
          symbol,
          interval,
          startTime: data.k.t,
          closeTime: data.k.T,
          open: data.k.o,
          close: data.k.c,
          high: data.k.h,
          low: data.k.l,
          volume: data.k.v,
          trades: data.k.n,
          final: data.k.x,
        };
        
        // WebSocket üzerinden yayınla
        broadcastKlineUpdate(symbol, interval, klineData);
        
        return true;
      }
      
      default:
        console.log(`İşlenmeyen veri tipi: ${data.e}`);
        return false;
    }
  } catch (error) {
    console.error('WebSocket veri işleme hatası:', error);
    return false;
  }
};

module.exports = {
  createWebSocketServer,
  broadcastPriceUpdate,
  broadcastTickerUpdate,
  broadcastDepthUpdate,
  broadcastKlineUpdate,
  processBinanceWebSocketData,
  MESSAGE_TYPES,
}; 