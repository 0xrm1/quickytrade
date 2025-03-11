/**
 * websocket/initializer.js
 * 
 * Bu modül, WebSocket bağlantılarını başlatır ve popüler sembolleri takip eder.
 * Binance API'den gelen verileri Redis'e kaydeder ve WebSocket üzerinden yayınlar.
 */

const { 
  subscribeToAllTickerStream, 
  subscribeToMultipleStreams,
  getPopularSymbols
} = require('../services/binanceClient');
const { getRedisClient } = require('../redis');

// Aktif WebSocket bağlantıları
let activeConnections = [];

/**
 * WebSocket bağlantılarını başlatır
 * @returns {Promise<Array>} - Aktif bağlantılar
 */
const initializeWebSockets = async () => {
  try {
    // Mevcut bağlantıları temizle
    closeAllConnections();
    
    // Tüm ticker'lar için WebSocket bağlantısı
    const allTickerWs = subscribeToAllTickerStream((data) => {
      // Veri işleme burada yapılır
      console.log(`Tüm ticker'lar için veri alındı: ${data.length} sembol`);
    });
    
    activeConnections.push(allTickerWs);
    
    // Popüler sembolleri al
    const popularSymbols = await getPopularSymbols(20);
    console.log(`Popüler semboller alındı: ${popularSymbols.join(', ')}`);
    
    // Popüler semboller için stream yapılandırmaları
    const streamConfigs = [];
    
    // Her sembol için trade ve depth stream'i ekle
    popularSymbols.forEach(symbol => {
      streamConfigs.push({ symbol, type: 'trade' });
      streamConfigs.push({ symbol, type: 'depth', level: '20' });
      
      // Farklı zaman aralıkları için kline stream'leri ekle
      ['1m', '5m', '15m', '1h', '4h', '1d'].forEach(interval => {
        streamConfigs.push({ symbol, type: 'kline', interval });
      });
    });
    
    // Birleştirilmiş WebSocket bağlantısı oluştur
    // Çok fazla stream olduğu için gruplar halinde bağlan
    const chunkSize = 50; // Binance bir bağlantıda en fazla 1024 stream destekler
    
    for (let i = 0; i < streamConfigs.length; i += chunkSize) {
      const chunk = streamConfigs.slice(i, i + chunkSize);
      
      const combinedWs = subscribeToMultipleStreams(chunk, (data) => {
        // Veri işleme burada yapılır
        if (data && data.stream) {
          console.log(`Veri alındı: ${data.stream}`);
        }
      });
      
      activeConnections.push(combinedWs);
    }
    
    console.log(`WebSocket bağlantıları başlatıldı: ${activeConnections.length} bağlantı`);
    
    // Redis'e bağlantı bilgilerini kaydet
    const redis = getRedisClient();
    if (redis) {
      await redis.set('websocket_connections_count', activeConnections.length);
      await redis.set('websocket_connections_timestamp', Date.now());
      await redis.set('websocket_tracked_symbols', JSON.stringify(popularSymbols));
    }
    
    return activeConnections;
  } catch (error) {
    console.error('WebSocket bağlantıları başlatılırken hata:', error);
    throw error;
  }
};

/**
 * Tüm WebSocket bağlantılarını kapatır
 */
const closeAllConnections = () => {
  activeConnections.forEach(ws => {
    if (ws && typeof ws.terminate === 'function') {
      ws.terminate();
    }
  });
  
  activeConnections = [];
};

/**
 * WebSocket bağlantı durumunu kontrol eder
 * @returns {Object} - Bağlantı durumu
 */
const checkConnectionStatus = () => {
  return {
    activeConnections: activeConnections.length,
    isConnected: activeConnections.length > 0,
    timestamp: Date.now(),
  };
};

/**
 * Belirli aralıklarla WebSocket bağlantılarını yeniler
 * @param {number} interval - Yenileme aralığı (ms)
 * @returns {NodeJS.Timeout} - Interval ID
 */
const startPeriodicReconnect = (interval = 3600000) => { // Varsayılan: 1 saat
  // Mevcut interval'i temizle
  if (global.wsReconnectInterval) {
    clearInterval(global.wsReconnectInterval);
  }
  
  // Yeni interval oluştur
  global.wsReconnectInterval = setInterval(async () => {
    console.log('WebSocket bağlantıları periyodik olarak yenileniyor...');
    await initializeWebSockets();
  }, interval);
  
  return global.wsReconnectInterval;
};

/**
 * Periyodik yenileme interval'ini durdurur
 */
const stopPeriodicReconnect = () => {
  if (global.wsReconnectInterval) {
    clearInterval(global.wsReconnectInterval);
    global.wsReconnectInterval = null;
  }
};

module.exports = {
  initializeWebSockets,
  closeAllConnections,
  checkConnectionStatus,
  startPeriodicReconnect,
  stopPeriodicReconnect,
}; 