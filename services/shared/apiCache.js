/**
 * apiCache.js
 * 
 * API önbelleği modülü.
 * Bu modül, Binance API çağrılarını önbelleğe alır ve yönetir.
 */

const axios = require('axios');
const Redis = require('ioredis');
const pako = require('pako');

// Redis bağlantısı
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Önbellek TTL değerleri (saniye cinsinden)
const DEFAULT_CACHE_TTL = {
  ticker: 60,
  klines: 300,
  market: 120,
  depth: 30,
  exchangeInfo: 3600,
  default: 60
};

// API URL'si
const BINANCE_API_URL = process.env.BINANCE_API_URL || 'https://api.binance.com';

class ApiCache {
  constructor() {
    this.cacheTTL = { ...DEFAULT_CACHE_TTL };
    
    // Redis bağlantı durumunu kontrol et
    redis.on('connect', () => {
      console.log('ApiCache: Redis bağlantısı başarılı');
    });
    
    redis.on('error', (err) => {
      console.error('ApiCache: Redis bağlantı hatası:', err);
    });
  }
  
  // Önbellek anahtarı oluştur
  _getCacheKey(type, params = {}) {
    const paramsStr = Object.entries(params)
      .map(([key, value]) => `${key}:${value}`)
      .join(':');
    
    return `api:${type}${paramsStr ? `:${paramsStr}` : ''}`;
  }
  
  // Veriyi sıkıştır
  _compressData(data) {
    const jsonStr = JSON.stringify(data);
    const compressed = pako.deflate(jsonStr);
    return Buffer.from(compressed).toString('base64');
  }
  
  // Veriyi aç
  _decompressData(compressedData) {
    const buffer = Buffer.from(compressedData, 'base64');
    const decompressed = pako.inflate(buffer, { to: 'string' });
    return JSON.parse(decompressed);
  }
  
  // Önbellekten veri al
  async _getFromCache(key) {
    try {
      const cachedData = await redis.get(key);
      
      if (!cachedData) {
        return null;
      }
      
      return this._decompressData(cachedData);
    } catch (error) {
      console.error(`ApiCache: Önbellekten veri alınırken hata: ${error.message}`);
      return null;
    }
  }
  
  // Veriyi önbelleğe kaydet
  async _setToCache(key, data, ttl) {
    try {
      const compressedData = this._compressData(data);
      await redis.set(key, compressedData, 'EX', ttl);
      return true;
    } catch (error) {
      console.error(`ApiCache: Veri önbelleğe kaydedilirken hata: ${error.message}`);
      return false;
    }
  }
  
  // Ticker verisi al
  async fetchTicker(symbol) {
    const cacheKey = this._getCacheKey('ticker', { symbol });
    
    // Önbellekten kontrol et
    const cachedData = await this._getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // API'den al
    try {
      const response = await axios.get(`${BINANCE_API_URL}/api/v3/ticker/24hr`, {
        params: { symbol }
      });
      
      // Önbelleğe kaydet
      await this._setToCache(cacheKey, response.data, this.cacheTTL.ticker);
      
      return response.data;
    } catch (error) {
      console.error(`ApiCache: Ticker verisi alınırken hata: ${error.message}`);
      throw error;
    }
  }
  
  // Birden fazla ticker verisi al
  async fetchTickers(symbols) {
    try {
      // Tüm sembolleri al
      const response = await axios.get(`${BINANCE_API_URL}/api/v3/ticker/24hr`);
      
      // Belirtilen sembolleri filtrele
      const filteredData = symbols.length > 0
        ? response.data.filter(ticker => symbols.includes(ticker.symbol))
        : response.data;
      
      // Her bir ticker için önbelleğe kaydet
      await Promise.all(
        filteredData.map(async (ticker) => {
          const cacheKey = this._getCacheKey('ticker', { symbol: ticker.symbol });
          await this._setToCache(cacheKey, ticker, this.cacheTTL.ticker);
        })
      );
      
      return filteredData;
    } catch (error) {
      console.error(`ApiCache: Tickers verisi alınırken hata: ${error.message}`);
      throw error;
    }
  }
  
  // Kline verisi al
  async fetchKlines(symbol, interval = '1h', limit = 100) {
    const cacheKey = this._getCacheKey('klines', { symbol, interval, limit });
    
    // Önbellekten kontrol et
    const cachedData = await this._getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // API'den al
    try {
      const response = await axios.get(`${BINANCE_API_URL}/api/v3/klines`, {
        params: { symbol, interval, limit }
      });
      
      // Önbelleğe kaydet
      await this._setToCache(cacheKey, response.data, this.cacheTTL.klines);
      
      return response.data;
    } catch (error) {
      console.error(`ApiCache: Klines verisi alınırken hata: ${error.message}`);
      throw error;
    }
  }
  
  // Market verisi al
  async fetchMarket(symbol) {
    const cacheKey = this._getCacheKey('market', { symbol });
    
    // Önbellekten kontrol et
    const cachedData = await this._getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // API'den al
    try {
      const [ticker, depth] = await Promise.all([
        this.fetchTicker(symbol),
        this.fetchDepth(symbol, 5)
      ]);
      
      const marketData = {
        symbol,
        ticker,
        depth
      };
      
      // Önbelleğe kaydet
      await this._setToCache(cacheKey, marketData, this.cacheTTL.market);
      
      return marketData;
    } catch (error) {
      console.error(`ApiCache: Market verisi alınırken hata: ${error.message}`);
      throw error;
    }
  }
  
  // Derinlik verisi al
  async fetchDepth(symbol, limit = 100) {
    const cacheKey = this._getCacheKey('depth', { symbol, limit });
    
    // Önbellekten kontrol et
    const cachedData = await this._getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // API'den al
    try {
      const response = await axios.get(`${BINANCE_API_URL}/api/v3/depth`, {
        params: { symbol, limit }
      });
      
      // Önbelleğe kaydet
      await this._setToCache(cacheKey, response.data, this.cacheTTL.depth);
      
      return response.data;
    } catch (error) {
      console.error(`ApiCache: Depth verisi alınırken hata: ${error.message}`);
      throw error;
    }
  }
  
  // İşlem verisi al
  async fetchTrades(symbol, limit = 100) {
    // İşlemler genellikle önbelleğe alınmaz, doğrudan API'den alınır
    try {
      const response = await axios.get(`${BINANCE_API_URL}/api/v3/trades`, {
        params: { symbol, limit }
      });
      
      return response.data;
    } catch (error) {
      console.error(`ApiCache: Trades verisi alınırken hata: ${error.message}`);
      throw error;
    }
  }
  
  // Borsa bilgisi al
  async fetchExchangeInfo() {
    const cacheKey = this._getCacheKey('exchangeInfo');
    
    // Önbellekten kontrol et
    const cachedData = await this._getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // API'den al
    try {
      const response = await axios.get(`${BINANCE_API_URL}/api/v3/exchangeInfo`);
      
      // Önbelleğe kaydet
      await this._setToCache(cacheKey, response.data, this.cacheTTL.exchangeInfo);
      
      return response.data;
    } catch (error) {
      console.error(`ApiCache: ExchangeInfo verisi alınırken hata: ${error.message}`);
      throw error;
    }
  }
  
  // Önbelleği temizle
  async clearCache() {
    try {
      const keys = await redis.keys('api:*');
      
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      
      return true;
    } catch (error) {
      console.error(`ApiCache: Önbellek temizlenirken hata: ${error.message}`);
      return false;
    }
  }
  
  // Önbellek TTL değerini ayarla
  async setCacheTTL(type, ttl) {
    if (!this.cacheTTL.hasOwnProperty(type)) {
      throw new Error(`Geçersiz önbellek tipi: ${type}`);
    }
    
    this.cacheTTL[type] = parseInt(ttl, 10);
    return true;
  }
  
  // Önbellek durumunu al
  async getCacheStatus() {
    try {
      const keys = await redis.keys('api:*');
      const status = {
        totalKeys: keys.length,
        ttlSettings: this.cacheTTL,
        keysByType: {}
      };
      
      // Her tip için anahtar sayısını hesapla
      for (const type of Object.keys(this.cacheTTL)) {
        const typeKeys = keys.filter(key => key.startsWith(`api:${type}`));
        status.keysByType[type] = typeKeys.length;
      }
      
      return status;
    } catch (error) {
      console.error(`ApiCache: Önbellek durumu alınırken hata: ${error.message}`);
      throw error;
    }
  }
  
  // Borsa bilgisini önbellekten al
  async getExchangeInfo() {
    const cacheKey = this._getCacheKey('exchangeInfo');
    return this._getFromCache(cacheKey);
  }
}

// Singleton örneği oluştur
const apiCache = new ApiCache();

module.exports = { apiCache }; 