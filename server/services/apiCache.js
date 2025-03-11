/**
 * apiCache.js
 * 
 * Bu dosya, API isteklerini Redis önbelleği ile optimize eden bir servis sağlar.
 * API isteklerini önbelleğe alır ve gerektiğinde önbellekten sunar.
 */

const axios = require('axios');
const redis = require('../redis');
const priceCache = require('./priceCache');

// API istek önbellek anahtarı öneki
const API_CACHE_PREFIX = 'api:';

// Varsayılan önbellek süreleri (saniye)
const DEFAULT_CACHE_TTL = {
  TICKER: 60,        // 1 dakika
  KLINES: 300,       // 5 dakika
  MARKET: 1800,      // 30 dakika
  EXCHANGE_INFO: 3600, // 1 saat
  DEPTH: 30,         // 30 saniye
  TRADES: 30,        // 30 saniye
};

// Önbellek süreleri
let cacheTTL = { ...DEFAULT_CACHE_TTL };

/**
 * Önbellek sürelerini ayarlama
 * @param {Object} newCacheTTL - Yeni önbellek süreleri
 */
const setCacheTTL = (newCacheTTL) => {
  cacheTTL = {
    ...cacheTTL,
    ...newCacheTTL,
  };
};

/**
 * API önbellek anahtarı oluşturma
 * @param {string} endpoint - API endpoint
 * @param {Object} params - İstek parametreleri
 * @returns {string} - Önbellek anahtarı
 */
const getApiCacheKey = (endpoint, params = {}) => {
  const paramString = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `${API_CACHE_PREFIX}${endpoint}${paramString ? `:${paramString}` : ''}`;
};

/**
 * API isteği yapma ve sonucu önbelleğe alma
 * @param {string} url - API URL
 * @param {Object} params - İstek parametreleri
 * @param {number} ttl - Önbellek süresi (saniye)
 * @param {Object} options - Axios seçenekleri
 * @returns {Promise<Object>} - API yanıtı
 */
const fetchWithCache = async (url, params = {}, ttl = redis.TTL.MEDIUM, options = {}) => {
  try {
    const cacheKey = getApiCacheKey(url, params);
    
    // Önbellekten kontrol et
    const cachedData = await redis.getCache(cacheKey);
    if (cachedData) {
      return {
        data: cachedData,
        source: 'cache',
      };
    }
    
    // API isteği yap
    const response = await axios({
      url,
      method: 'GET',
      params,
      ...options,
    });
    
    // Yanıtı önbelleğe al
    if (response.data) {
      await redis.setCache(cacheKey, response.data, ttl);
    }
    
    return {
      data: response.data,
      source: 'api',
    };
  } catch (error) {
    console.error(`API fetch error for ${url}:`, error);
    throw error;
  }
};

/**
 * Ticker verisi alma
 * @param {string} symbol - Sembol
 * @returns {Promise<Object>} - Ticker verisi
 */
const getTicker = async (symbol) => {
  try {
    // Önbellekten kontrol et
    const cachedTicker = await priceCache.getCachedTicker(symbol);
    if (cachedTicker) {
      return {
        data: cachedTicker,
        source: 'cache',
      };
    }
    
    // API'den al
    const response = await fetchWithCache(
      'https://api.binance.com/api/v3/ticker/24hr',
      { symbol },
      cacheTTL.TICKER
    );
    
    // Yanıtı önbelleğe al
    if (response.data && response.source === 'api') {
      await priceCache.cacheTicker(symbol, response.data);
    }
    
    return response;
  } catch (error) {
    console.error(`Get ticker error for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Kline verisi alma
 * @param {string} symbol - Sembol
 * @param {string} interval - Aralık
 * @param {number} limit - Limit
 * @returns {Promise<Object>} - Kline verisi
 */
const getKlines = async (symbol, interval, limit = 500) => {
  try {
    // Önbellekten kontrol et
    const cachedKlines = await priceCache.getCachedKlines(symbol, interval);
    if (cachedKlines) {
      return {
        data: cachedKlines,
        source: 'cache',
      };
    }
    
    // API'den al
    const response = await fetchWithCache(
      'https://api.binance.com/api/v3/klines',
      { symbol, interval, limit },
      cacheTTL.KLINES
    );
    
    // Yanıtı önbelleğe al
    if (response.data && response.source === 'api') {
      await priceCache.cacheKlines(symbol, interval, response.data);
    }
    
    return response;
  } catch (error) {
    console.error(`Get klines error for ${symbol} ${interval}:`, error);
    throw error;
  }
};

/**
 * Piyasa verisi alma
 * @param {string} market - Piyasa (örn. BTC, USDT)
 * @returns {Promise<Object>} - Piyasa verisi
 */
const getMarket = async (market) => {
  try {
    // Önbellekten kontrol et
    const cachedMarket = await priceCache.getCachedMarket(market);
    if (cachedMarket) {
      return {
        data: cachedMarket,
        source: 'cache',
      };
    }
    
    // Tüm sembolleri al
    const response = await fetchWithCache(
      'https://api.binance.com/api/v3/exchangeInfo',
      {},
      cacheTTL.EXCHANGE_INFO
    );
    
    if (response.data && response.data.symbols) {
      // Piyasaya göre filtrele
      const marketSymbols = response.data.symbols
        .filter(symbol => symbol.quoteAsset === market.toUpperCase())
        .map(symbol => ({
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
        }));
      
      // Yanıtı önbelleğe al
      await priceCache.cacheMarket(market, marketSymbols);
      
      return {
        data: marketSymbols,
        source: 'api',
      };
    }
    
    return response;
  } catch (error) {
    console.error(`Get market error for ${market}:`, error);
    throw error;
  }
};

/**
 * Derinlik verisi alma
 * @param {string} symbol - Sembol
 * @param {number} limit - Limit
 * @returns {Promise<Object>} - Derinlik verisi
 */
const getDepth = async (symbol, limit = 100) => {
  try {
    // Önbellekten kontrol et
    const cachedDepth = await priceCache.getCachedDepth(symbol);
    if (cachedDepth) {
      return {
        data: cachedDepth,
        source: 'cache',
      };
    }
    
    // API'den al
    const response = await fetchWithCache(
      'https://api.binance.com/api/v3/depth',
      { symbol, limit },
      cacheTTL.DEPTH
    );
    
    // Yanıtı önbelleğe al
    if (response.data && response.source === 'api') {
      await priceCache.cacheDepth(symbol, response.data);
    }
    
    return response;
  } catch (error) {
    console.error(`Get depth error for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Son işlemler verisi alma
 * @param {string} symbol - Sembol
 * @param {number} limit - Limit
 * @returns {Promise<Object>} - Son işlemler verisi
 */
const getTrades = async (symbol, limit = 500) => {
  try {
    return await fetchWithCache(
      'https://api.binance.com/api/v3/trades',
      { symbol, limit },
      cacheTTL.TRADES
    );
  } catch (error) {
    console.error(`Get trades error for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Borsa bilgisi alma
 * @returns {Promise<Object>} - Borsa bilgisi
 */
const getExchangeInfo = async () => {
  try {
    return await fetchWithCache(
      'https://api.binance.com/api/v3/exchangeInfo',
      {},
      cacheTTL.EXCHANGE_INFO
    );
  } catch (error) {
    console.error('Get exchange info error:', error);
    throw error;
  }
};

/**
 * API önbelleğini temizleme
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const clearApiCache = async () => {
  try {
    return await redis.deleteCacheByPrefix(API_CACHE_PREFIX);
  } catch (error) {
    console.error('Clear API cache error:', error);
    return false;
  }
};

/**
 * Tüm önbellekleri temizleme
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const clearAllCaches = async () => {
  try {
    await clearApiCache();
    await priceCache.clearAllCaches();
    return true;
  } catch (error) {
    console.error('Clear all caches error:', error);
    return false;
  }
};

module.exports = {
  getTicker,
  getKlines,
  getMarket,
  getDepth,
  getTrades,
  getExchangeInfo,
  fetchWithCache,
  clearApiCache,
  clearAllCaches,
  setCacheTTL,
  DEFAULT_CACHE_TTL,
}; 