/**
 * priceCache.js
 * 
 * Bu dosya, fiyat verilerini Redis'te depolama ve alma için bir servis sağlar.
 * Eşik tabanlı güncellemeler ile Redis yazma işlemlerini optimize eder.
 */

const redis = require('../redis');

// Önbellek anahtarı önekleri
const CACHE_KEYS = {
  PRICE: 'price:',
  TICKER: 'ticker:',
  MARKET: 'market:',
  DEPTH: 'depth:',
  KLINE: 'kline:',
};

// Varsayılan eşik değerleri
const DEFAULT_THRESHOLDS = {
  PERCENTAGE: 0.5, // %0.5 değişim
  ABSOLUTE: 10, // 10 birim değişim
  TIME: 30, // 30 saniye
};

// Eşik değerleri
let thresholds = { ...DEFAULT_THRESHOLDS };

/**
 * Eşik değerlerini ayarlama
 * @param {Object} newThresholds - Yeni eşik değerleri
 */
const setThresholds = (newThresholds) => {
  thresholds = {
    ...thresholds,
    ...newThresholds,
  };
};

/**
 * Fiyat önbellek anahtarı oluşturma
 * @param {string} symbol - Sembol
 * @returns {string} - Önbellek anahtarı
 */
const getPriceKey = (symbol) => `${CACHE_KEYS.PRICE}${symbol.toUpperCase()}`;

/**
 * Ticker önbellek anahtarı oluşturma
 * @param {string} symbol - Sembol
 * @returns {string} - Önbellek anahtarı
 */
const getTickerKey = (symbol) => `${CACHE_KEYS.TICKER}${symbol.toUpperCase()}`;

/**
 * Market önbellek anahtarı oluşturma
 * @param {string} market - Piyasa
 * @returns {string} - Önbellek anahtarı
 */
const getMarketKey = (market) => `${CACHE_KEYS.MARKET}${market.toUpperCase()}`;

/**
 * Derinlik önbellek anahtarı oluşturma
 * @param {string} symbol - Sembol
 * @returns {string} - Önbellek anahtarı
 */
const getDepthKey = (symbol) => `${CACHE_KEYS.DEPTH}${symbol.toUpperCase()}`;

/**
 * Kline önbellek anahtarı oluşturma
 * @param {string} symbol - Sembol
 * @param {string} interval - Aralık
 * @returns {string} - Önbellek anahtarı
 */
const getKlineKey = (symbol, interval) => `${CACHE_KEYS.KLINE}${symbol.toUpperCase()}:${interval}`;

/**
 * Fiyat verisini önbelleğe alma
 * @param {string} symbol - Sembol
 * @param {number} price - Fiyat
 * @param {number} ttl - Önbellek süresi (saniye)
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const cachePrice = async (symbol, price, ttl = redis.TTL.SHORT) => {
  try {
    const key = getPriceKey(symbol);
    return await redis.setCache(key, price, ttl);
  } catch (error) {
    console.error(`Cache price error for ${symbol}:`, error);
    return false;
  }
};

/**
 * Önbellekten fiyat verisini alma
 * @param {string} symbol - Sembol
 * @returns {Promise<number|null>} - Fiyat veya null
 */
const getCachedPrice = async (symbol) => {
  try {
    const key = getPriceKey(symbol);
    return await redis.getCache(key);
  } catch (error) {
    console.error(`Get cached price error for ${symbol}:`, error);
    return null;
  }
};

/**
 * Ticker verisini önbelleğe alma
 * @param {string} symbol - Sembol
 * @param {Object} ticker - Ticker verisi
 * @param {number} ttl - Önbellek süresi (saniye)
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const cacheTicker = async (symbol, ticker, ttl = redis.TTL.SHORT) => {
  try {
    const key = getTickerKey(symbol);
    return await redis.setCache(key, ticker, ttl);
  } catch (error) {
    console.error(`Cache ticker error for ${symbol}:`, error);
    return false;
  }
};

/**
 * Önbellekten ticker verisini alma
 * @param {string} symbol - Sembol
 * @returns {Promise<Object|null>} - Ticker verisi veya null
 */
const getCachedTicker = async (symbol) => {
  try {
    const key = getTickerKey(symbol);
    return await redis.getCache(key);
  } catch (error) {
    console.error(`Get cached ticker error for ${symbol}:`, error);
    return null;
  }
};

/**
 * Piyasa verilerini önbelleğe alma
 * @param {string} market - Piyasa
 * @param {Array} symbols - Semboller
 * @param {number} ttl - Önbellek süresi (saniye)
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const cacheMarket = async (market, symbols, ttl = redis.TTL.MEDIUM) => {
  try {
    const key = getMarketKey(market);
    return await redis.setCache(key, symbols, ttl);
  } catch (error) {
    console.error(`Cache market error for ${market}:`, error);
    return false;
  }
};

/**
 * Önbellekten piyasa verilerini alma
 * @param {string} market - Piyasa
 * @returns {Promise<Array|null>} - Semboller veya null
 */
const getCachedMarket = async (market) => {
  try {
    const key = getMarketKey(market);
    return await redis.getCache(key);
  } catch (error) {
    console.error(`Get cached market error for ${market}:`, error);
    return null;
  }
};

/**
 * Derinlik verisini önbelleğe alma
 * @param {string} symbol - Sembol
 * @param {Object} depth - Derinlik verisi
 * @param {number} ttl - Önbellek süresi (saniye)
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const cacheDepth = async (symbol, depth, ttl = redis.TTL.SHORT) => {
  try {
    const key = getDepthKey(symbol);
    return await redis.setCache(key, depth, ttl);
  } catch (error) {
    console.error(`Cache depth error for ${symbol}:`, error);
    return false;
  }
};

/**
 * Önbellekten derinlik verisini alma
 * @param {string} symbol - Sembol
 * @returns {Promise<Object|null>} - Derinlik verisi veya null
 */
const getCachedDepth = async (symbol) => {
  try {
    const key = getDepthKey(symbol);
    return await redis.getCache(key);
  } catch (error) {
    console.error(`Get cached depth error for ${symbol}:`, error);
    return null;
  }
};

/**
 * Kline verisini önbelleğe alma
 * @param {string} symbol - Sembol
 * @param {string} interval - Aralık
 * @param {Array} klines - Kline verisi
 * @param {number} ttl - Önbellek süresi (saniye)
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const cacheKlines = async (symbol, interval, klines, ttl = redis.TTL.MEDIUM) => {
  try {
    const key = getKlineKey(symbol, interval);
    return await redis.setCache(key, klines, ttl);
  } catch (error) {
    console.error(`Cache klines error for ${symbol} ${interval}:`, error);
    return false;
  }
};

/**
 * Önbellekten kline verisini alma
 * @param {string} symbol - Sembol
 * @param {string} interval - Aralık
 * @returns {Promise<Array|null>} - Kline verisi veya null
 */
const getCachedKlines = async (symbol, interval) => {
  try {
    const key = getKlineKey(symbol, interval);
    return await redis.getCache(key);
  } catch (error) {
    console.error(`Get cached klines error for ${symbol} ${interval}:`, error);
    return null;
  }
};

/**
 * Eşik tabanlı fiyat güncellemesi
 * @param {string} symbol - Sembol
 * @param {number} price - Yeni fiyat
 * @returns {Promise<boolean>} - Güncellendi mi
 */
const updatePriceWithThreshold = async (symbol, price) => {
  try {
    const key = getPriceKey(symbol);
    const cachedPrice = await getCachedPrice(symbol);
    
    // İlk fiyat ise, önbelleğe al
    if (cachedPrice === null) {
      await cachePrice(symbol, price);
      return true;
    }
    
    // Fiyat değişimi hesapla
    const absoluteChange = Math.abs(price - cachedPrice);
    const percentageChange = (absoluteChange / cachedPrice) * 100;
    
    // Eşik değerlerini kontrol et
    if (
      percentageChange >= thresholds.PERCENTAGE ||
      absoluteChange >= thresholds.ABSOLUTE
    ) {
      await cachePrice(symbol, price);
      return true;
    }
    
    // TTL kontrolü
    const ttl = await redis.getCacheTTL(key);
    if (ttl < 0 || ttl < thresholds.TIME) {
      await cachePrice(symbol, price);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Update price with threshold error for ${symbol}:`, error);
    return false;
  }
};

/**
 * Eşik tabanlı ticker güncellemesi
 * @param {string} symbol - Sembol
 * @param {Object} ticker - Yeni ticker verisi
 * @returns {Promise<boolean>} - Güncellendi mi
 */
const updateTickerWithThreshold = async (symbol, ticker) => {
  try {
    const key = getTickerKey(symbol);
    const cachedTicker = await getCachedTicker(symbol);
    
    // İlk ticker ise, önbelleğe al
    if (cachedTicker === null) {
      await cacheTicker(symbol, ticker);
      return true;
    }
    
    // Fiyat değişimi hesapla
    const currentPrice = parseFloat(ticker.c);
    const lastPrice = parseFloat(cachedTicker.c);
    const absoluteChange = Math.abs(currentPrice - lastPrice);
    const percentageChange = (absoluteChange / lastPrice) * 100;
    
    // Eşik değerlerini kontrol et
    if (
      percentageChange >= thresholds.PERCENTAGE ||
      absoluteChange >= thresholds.ABSOLUTE
    ) {
      await cacheTicker(symbol, ticker);
      return true;
    }
    
    // TTL kontrolü
    const ttl = await redis.getCacheTTL(key);
    if (ttl < 0 || ttl < thresholds.TIME) {
      await cacheTicker(symbol, ticker);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Update ticker with threshold error for ${symbol}:`, error);
    return false;
  }
};

/**
 * Tüm fiyat önbelleklerini temizleme
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const clearPriceCaches = async () => {
  try {
    return await redis.deleteCacheByPrefix(CACHE_KEYS.PRICE);
  } catch (error) {
    console.error('Clear price caches error:', error);
    return false;
  }
};

/**
 * Tüm ticker önbelleklerini temizleme
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const clearTickerCaches = async () => {
  try {
    return await redis.deleteCacheByPrefix(CACHE_KEYS.TICKER);
  } catch (error) {
    console.error('Clear ticker caches error:', error);
    return false;
  }
};

/**
 * Tüm piyasa önbelleklerini temizleme
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const clearMarketCaches = async () => {
  try {
    return await redis.deleteCacheByPrefix(CACHE_KEYS.MARKET);
  } catch (error) {
    console.error('Clear market caches error:', error);
    return false;
  }
};

/**
 * Tüm derinlik önbelleklerini temizleme
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const clearDepthCaches = async () => {
  try {
    return await redis.deleteCacheByPrefix(CACHE_KEYS.DEPTH);
  } catch (error) {
    console.error('Clear depth caches error:', error);
    return false;
  }
};

/**
 * Tüm kline önbelleklerini temizleme
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const clearKlineCaches = async () => {
  try {
    return await redis.deleteCacheByPrefix(CACHE_KEYS.KLINE);
  } catch (error) {
    console.error('Clear kline caches error:', error);
    return false;
  }
};

/**
 * Tüm önbellekleri temizleme
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const clearAllCaches = async () => {
  try {
    await clearPriceCaches();
    await clearTickerCaches();
    await clearMarketCaches();
    await clearDepthCaches();
    await clearKlineCaches();
    return true;
  } catch (error) {
    console.error('Clear all caches error:', error);
    return false;
  }
};

module.exports = {
  cachePrice,
  getCachedPrice,
  cacheTicker,
  getCachedTicker,
  cacheMarket,
  getCachedMarket,
  cacheDepth,
  getCachedDepth,
  cacheKlines,
  getCachedKlines,
  updatePriceWithThreshold,
  updateTickerWithThreshold,
  clearPriceCaches,
  clearTickerCaches,
  clearMarketCaches,
  clearDepthCaches,
  clearKlineCaches,
  clearAllCaches,
  setThresholds,
  CACHE_KEYS,
}; 