/**
 * binanceClient.js
 * 
 * Bu modül, Binance API ile iletişim kurmak için kullanılan istemciyi sağlar.
 * REST API ve WebSocket API için yöntemler içerir.
 */

const axios = require('axios');
const WebSocket = require('ws');
const { processBinanceWebSocketData } = require('../websocket');
const { getRedisClient } = require('../redis');

// Binance API URL'leri
const BINANCE_API_URL = 'https://api.binance.com';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
const BINANCE_WS_COMBINED_URL = 'wss://stream.binance.com:9443/stream';

// WebSocket bağlantıları
const wsConnections = new Map();

/**
 * Binance REST API'sine istek gönderir
 * @param {string} endpoint - API endpoint'i
 * @param {Object} params - İstek parametreleri
 * @param {string} method - HTTP metodu (GET, POST, DELETE, PUT)
 * @returns {Promise<Object>} - API yanıtı
 */
const callBinanceAPI = async (endpoint, params = {}, method = 'GET') => {
  try {
    const url = `${BINANCE_API_URL}${endpoint}`;
    
    const config = {
      method,
      url,
      params: method === 'GET' ? params : undefined,
      data: method !== 'GET' ? params : undefined,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'QuickyTrade/1.0.0',
      },
      timeout: 30000, // 30 saniye
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Binance API hatası (${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Ticker verilerini alır
 * @param {string} symbol - Sembol (örn. BTCUSDT)
 * @returns {Promise<Object>} - Ticker verisi
 */
const getTicker = async (symbol) => {
  return callBinanceAPI('/api/v3/ticker/24hr', { symbol });
};

/**
 * Birden fazla sembol için ticker verilerini alır
 * @param {Array<string>} symbols - Semboller dizisi
 * @returns {Promise<Array<Object>>} - Ticker verileri dizisi
 */
const getTickers = async (symbols = []) => {
  if (symbols.length === 0) {
    return callBinanceAPI('/api/v3/ticker/24hr');
  }
  
  // Sembolleri formatlı bir şekilde gönder
  const symbolsParam = symbols.join('","');
  return callBinanceAPI('/api/v3/ticker/24hr', { symbols: `["${symbolsParam}"]` });
};

/**
 * Kline (mum) verilerini alır
 * @param {string} symbol - Sembol (örn. BTCUSDT)
 * @param {string} interval - Zaman aralığı (1m, 5m, 15m, 1h, 4h, 1d, 1w, 1M)
 * @param {number} limit - Sonuç sayısı (max 1000)
 * @returns {Promise<Array<Object>>} - Kline verileri dizisi
 */
const getKlines = async (symbol, interval, limit = 500) => {
  return callBinanceAPI('/api/v3/klines', { symbol, interval, limit });
};

/**
 * Piyasa verilerini alır
 * @param {string} symbol - Sembol (örn. BTCUSDT)
 * @returns {Promise<Object>} - Piyasa verisi
 */
const getMarketData = async (symbol) => {
  const ticker = await getTicker(symbol);
  const trades = await callBinanceAPI('/api/v3/trades', { symbol, limit: 10 });
  
  return {
    ticker,
    recentTrades: trades,
  };
};

/**
 * Emir defteri verilerini alır
 * @param {string} symbol - Sembol (örn. BTCUSDT)
 * @param {number} limit - Sonuç sayısı (max 5000)
 * @returns {Promise<Object>} - Emir defteri verisi
 */
const getDepth = async (symbol, limit = 100) => {
  return callBinanceAPI('/api/v3/depth', { symbol, limit });
};

/**
 * Son işlemleri alır
 * @param {string} symbol - Sembol (örn. BTCUSDT)
 * @param {number} limit - Sonuç sayısı (max 1000)
 * @returns {Promise<Array<Object>>} - İşlemler dizisi
 */
const getTrades = async (symbol, limit = 50) => {
  return callBinanceAPI('/api/v3/trades', { symbol, limit });
};

/**
 * Borsa bilgilerini alır
 * @returns {Promise<Object>} - Borsa bilgileri
 */
const getExchangeInfo = async () => {
  return callBinanceAPI('/api/v3/exchangeInfo');
};

/**
 * Sembol bilgilerini alır
 * @param {string} symbol - Sembol (örn. BTCUSDT)
 * @returns {Promise<Object>} - Sembol bilgileri
 */
const getSymbolInfo = async (symbol) => {
  const exchangeInfo = await getExchangeInfo();
  return exchangeInfo.symbols.find(s => s.symbol === symbol);
};

/**
 * WebSocket bağlantısı oluşturur
 * @param {string} stream - Stream adı
 * @param {Function} messageHandler - Mesaj işleyici fonksiyon
 * @returns {WebSocket} - WebSocket bağlantısı
 */
const createWebSocketConnection = (stream, messageHandler) => {
  // Mevcut bağlantıyı kontrol et
  if (wsConnections.has(stream)) {
    const existingWs = wsConnections.get(stream);
    if (existingWs.readyState === WebSocket.OPEN) {
      return existingWs;
    }
    // Bağlantı kapalıysa kapat
    existingWs.terminate();
  }
  
  // Yeni bağlantı oluştur
  const ws = new WebSocket(`${BINANCE_WS_URL}/${stream}`);
  
  // Bağlantı olaylarını dinle
  ws.on('open', () => {
    console.log(`Binance WebSocket bağlantısı açıldı: ${stream}`);
  });
  
  ws.on('message', (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      
      // Özel işleyici varsa çağır
      if (typeof messageHandler === 'function') {
        messageHandler(parsedData);
      }
      
      // Genel işleyici ile işle
      processBinanceWebSocketData(parsedData);
    } catch (error) {
      console.error(`WebSocket mesaj işleme hatası (${stream}):`, error);
    }
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket hatası (${stream}):`, error);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`WebSocket bağlantısı kapandı (${stream}): ${code} - ${reason}`);
    
    // Bağlantıyı kaldır
    wsConnections.delete(stream);
    
    // Yeniden bağlan
    setTimeout(() => {
      console.log(`WebSocket yeniden bağlanıyor: ${stream}`);
      createWebSocketConnection(stream, messageHandler);
    }, 5000);
  });
  
  // Bağlantıyı kaydet
  wsConnections.set(stream, ws);
  
  return ws;
};

/**
 * Birden fazla stream için tek bir WebSocket bağlantısı oluşturur
 * @param {Array<string>} streams - Stream adları dizisi
 * @param {Function} messageHandler - Mesaj işleyici fonksiyon
 * @returns {WebSocket} - WebSocket bağlantısı
 */
const createCombinedWebSocketConnection = (streams, messageHandler) => {
  // Stream adlarını birleştir
  const streamKey = streams.join('_');
  
  // Mevcut bağlantıyı kontrol et
  if (wsConnections.has(streamKey)) {
    const existingWs = wsConnections.get(streamKey);
    if (existingWs.readyState === WebSocket.OPEN) {
      return existingWs;
    }
    // Bağlantı kapalıysa kapat
    existingWs.terminate();
  }
  
  // Yeni bağlantı oluştur
  const ws = new WebSocket(`${BINANCE_WS_COMBINED_URL}?streams=${streams.join('/')}`);
  
  // Bağlantı olaylarını dinle
  ws.on('open', () => {
    console.log(`Binance kombine WebSocket bağlantısı açıldı: ${streamKey}`);
  });
  
  ws.on('message', (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      
      // Özel işleyici varsa çağır
      if (typeof messageHandler === 'function') {
        messageHandler(parsedData);
      }
      
      // Genel işleyici ile işle (stream verisi farklı formatta)
      if (parsedData.data) {
        processBinanceWebSocketData(parsedData.data);
      }
    } catch (error) {
      console.error(`WebSocket mesaj işleme hatası (${streamKey}):`, error);
    }
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket hatası (${streamKey}):`, error);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`WebSocket bağlantısı kapandı (${streamKey}): ${code} - ${reason}`);
    
    // Bağlantıyı kaldır
    wsConnections.delete(streamKey);
    
    // Yeniden bağlan
    setTimeout(() => {
      console.log(`WebSocket yeniden bağlanıyor: ${streamKey}`);
      createCombinedWebSocketConnection(streams, messageHandler);
    }, 5000);
  });
  
  // Bağlantıyı kaydet
  wsConnections.set(streamKey, ws);
  
  return ws;
};

/**
 * Ticker stream'i oluşturur
 * @param {string} symbol - Sembol (örn. BTCUSDT)
 * @param {Function} messageHandler - Mesaj işleyici fonksiyon
 * @returns {WebSocket} - WebSocket bağlantısı
 */
const subscribeToTickerStream = (symbol, messageHandler) => {
  const stream = `${symbol.toLowerCase()}@ticker`;
  return createWebSocketConnection(stream, messageHandler);
};

/**
 * Tüm semboller için ticker stream'i oluşturur
 * @param {Function} messageHandler - Mesaj işleyici fonksiyon
 * @returns {WebSocket} - WebSocket bağlantısı
 */
const subscribeToAllTickerStream = (messageHandler) => {
  const stream = '!ticker@arr';
  return createWebSocketConnection(stream, messageHandler);
};

/**
 * İşlem stream'i oluşturur
 * @param {string} symbol - Sembol (örn. BTCUSDT)
 * @param {Function} messageHandler - Mesaj işleyici fonksiyon
 * @returns {WebSocket} - WebSocket bağlantısı
 */
const subscribeToTradeStream = (symbol, messageHandler) => {
  const stream = `${symbol.toLowerCase()}@trade`;
  return createWebSocketConnection(stream, messageHandler);
};

/**
 * Kline stream'i oluşturur
 * @param {string} symbol - Sembol (örn. BTCUSDT)
 * @param {string} interval - Zaman aralığı (1m, 5m, 15m, 1h, 4h, 1d, 1w, 1M)
 * @param {Function} messageHandler - Mesaj işleyici fonksiyon
 * @returns {WebSocket} - WebSocket bağlantısı
 */
const subscribeToKlineStream = (symbol, interval, messageHandler) => {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  return createWebSocketConnection(stream, messageHandler);
};

/**
 * Derinlik stream'i oluşturur
 * @param {string} symbol - Sembol (örn. BTCUSDT)
 * @param {string} level - Derinlik seviyesi (5, 10, 20)
 * @param {Function} messageHandler - Mesaj işleyici fonksiyon
 * @returns {WebSocket} - WebSocket bağlantısı
 */
const subscribeToDepthStream = (symbol, level = '20', messageHandler) => {
  const stream = `${symbol.toLowerCase()}@depth${level}`;
  return createWebSocketConnection(stream, messageHandler);
};

/**
 * Birden fazla sembol için stream'leri birleştirir
 * @param {Array<Object>} streamConfigs - Stream yapılandırmaları dizisi
 * @param {Function} messageHandler - Mesaj işleyici fonksiyon
 * @returns {WebSocket} - WebSocket bağlantısı
 * 
 * @example
 * // Örnek kullanım
 * const streams = [
 *   { symbol: 'BTCUSDT', type: 'ticker' },
 *   { symbol: 'ETHUSDT', type: 'trade' },
 *   { symbol: 'BNBUSDT', type: 'kline', interval: '1m' }
 * ];
 * subscribeToMultipleStreams(streams, handleMessage);
 */
const subscribeToMultipleStreams = (streamConfigs, messageHandler) => {
  const streams = streamConfigs.map(config => {
    const { symbol, type, interval, level } = config;
    const symbolLower = symbol.toLowerCase();
    
    switch (type) {
      case 'ticker':
        return `${symbolLower}@ticker`;
      case 'trade':
        return `${symbolLower}@trade`;
      case 'kline':
        return `${symbolLower}@kline_${interval || '1m'}`;
      case 'depth':
        return `${symbolLower}@depth${level || '20'}`;
      default:
        return `${symbolLower}@${type}`;
    }
  });
  
  return createCombinedWebSocketConnection(streams, messageHandler);
};

/**
 * Tüm WebSocket bağlantılarını kapatır
 */
const closeAllWebSocketConnections = () => {
  for (const [stream, ws] of wsConnections.entries()) {
    console.log(`WebSocket bağlantısı kapatılıyor: ${stream}`);
    ws.terminate();
  }
  
  wsConnections.clear();
};

/**
 * Popüler sembolleri alır
 * @param {number} limit - Sonuç sayısı
 * @returns {Promise<Array<string>>} - Semboller dizisi
 */
const getPopularSymbols = async (limit = 20) => {
  try {
    // Redis'ten popüler sembolleri al
    const redis = getRedisClient();
    if (redis) {
      const cachedSymbols = await redis.get('popular_symbols');
      if (cachedSymbols) {
        return JSON.parse(cachedSymbols);
      }
    }
    
    // Tüm sembolleri al ve hacme göre sırala
    const tickers = await getTickers();
    
    // USDT çiftlerini filtrele
    const usdtPairs = tickers.filter(ticker => 
      ticker.symbol.endsWith('USDT') && 
      !ticker.symbol.includes('UP') && 
      !ticker.symbol.includes('DOWN') &&
      !ticker.symbol.includes('BEAR') && 
      !ticker.symbol.includes('BULL')
    );
    
    // Hacme göre sırala
    const sortedByVolume = usdtPairs.sort((a, b) => 
      parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)
    );
    
    // İlk 'limit' kadar sembolü al
    const popularSymbols = sortedByVolume.slice(0, limit).map(ticker => ticker.symbol);
    
    // Redis'e kaydet (1 saat TTL)
    if (redis) {
      await redis.set('popular_symbols', JSON.stringify(popularSymbols), 'EX', 3600);
    }
    
    return popularSymbols;
  } catch (error) {
    console.error('Popüler semboller alınırken hata:', error);
    return [];
  }
};

module.exports = {
  callBinanceAPI,
  getTicker,
  getTickers,
  getKlines,
  getMarketData,
  getDepth,
  getTrades,
  getExchangeInfo,
  getSymbolInfo,
  createWebSocketConnection,
  createCombinedWebSocketConnection,
  subscribeToTickerStream,
  subscribeToAllTickerStream,
  subscribeToTradeStream,
  subscribeToKlineStream,
  subscribeToDepthStream,
  subscribeToMultipleStreams,
  closeAllWebSocketConnections,
  getPopularSymbols,
}; 