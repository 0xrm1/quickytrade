/**
 * redis.js
 * 
 * Bu dosya, Redis bağlantısı ve yapılandırması için bir servis sağlar.
 * Önbellek işlemleri için kullanılır.
 */

const Redis = require('ioredis');
const { promisify } = require('util');

// Redis bağlantı URL'si
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis yapılandırması
const redisConfig = {
  retryStrategy: (times) => {
    // Yeniden bağlanma stratejisi
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  autoResubscribe: true,
};

// Redis istemcisi
let redisClient;

/**
 * Redis bağlantısını başlatma
 * @returns {Redis} - Redis istemcisi
 */
const initRedis = () => {
  if (redisClient) {
    return redisClient;
  }
  
  try {
    redisClient = new Redis(REDIS_URL, redisConfig);
    
    // Bağlantı olayları
    redisClient.on('connect', () => {
      console.log('Redis connected');
    });
    
    redisClient.on('ready', () => {
      console.log('Redis ready');
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });
    
    redisClient.on('close', () => {
      console.log('Redis connection closed');
    });
    
    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting');
    });
    
    return redisClient;
  } catch (error) {
    console.error('Redis initialization error:', error);
    throw error;
  }
};

/**
 * Redis istemcisini alma
 * @returns {Redis} - Redis istemcisi
 */
const getRedisClient = () => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

/**
 * Redis bağlantısını kapatma
 */
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
};

// Önbellek TTL (Time To Live) değerleri (saniye cinsinden)
const TTL = {
  SHORT: 60, // 1 dakika
  MEDIUM: 300, // 5 dakika
  LONG: 3600, // 1 saat
  DAY: 86400, // 1 gün
};

/**
 * Veriyi önbelleğe alma
 * @param {string} key - Önbellek anahtarı
 * @param {any} data - Önbelleğe alınacak veri
 * @param {number} ttl - Önbellek süresi (saniye)
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const setCache = async (key, data, ttl = TTL.MEDIUM) => {
  try {
    const client = getRedisClient();
    const value = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (ttl > 0) {
      await client.setex(key, ttl, value);
    } else {
      await client.set(key, value);
    }
    
    return true;
  } catch (error) {
    console.error('Redis set cache error:', error);
    return false;
  }
};

/**
 * Önbellekten veri alma
 * @param {string} key - Önbellek anahtarı
 * @returns {Promise<any|null>} - Önbellekteki veri veya null
 */
const getCache = async (key) => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  } catch (error) {
    console.error('Redis get cache error:', error);
    return null;
  }
};

/**
 * Önbellekten veriyi silme
 * @param {string} key - Önbellek anahtarı
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const deleteCache = async (key) => {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete cache error:', error);
    return false;
  }
};

/**
 * Belirli bir önekle başlayan tüm önbellek öğelerini silme
 * @param {string} prefix - Önbellek anahtarı öneki
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const deleteCacheByPrefix = async (prefix) => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(`${prefix}*`);
    
    if (keys.length > 0) {
      await client.del(...keys);
    }
    
    return true;
  } catch (error) {
    console.error('Redis delete cache by prefix error:', error);
    return false;
  }
};

/**
 * Tüm önbelleği temizleme
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const flushCache = async () => {
  try {
    const client = getRedisClient();
    await client.flushdb();
    return true;
  } catch (error) {
    console.error('Redis flush cache error:', error);
    return false;
  }
};

/**
 * Önbellek anahtarının süresini uzatma
 * @param {string} key - Önbellek anahtarı
 * @param {number} ttl - Yeni önbellek süresi (saniye)
 * @returns {Promise<boolean>} - İşlem başarılı mı
 */
const extendCacheTTL = async (key, ttl = TTL.MEDIUM) => {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    
    if (exists) {
      await client.expire(key, ttl);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Redis extend cache TTL error:', error);
    return false;
  }
};

/**
 * Önbellek anahtarının kalan süresini alma
 * @param {string} key - Önbellek anahtarı
 * @returns {Promise<number>} - Kalan süre (saniye)
 */
const getCacheTTL = async (key) => {
  try {
    const client = getRedisClient();
    return await client.ttl(key);
  } catch (error) {
    console.error('Redis get cache TTL error:', error);
    return -1;
  }
};

/**
 * Önbellek anahtarının var olup olmadığını kontrol etme
 * @param {string} key - Önbellek anahtarı
 * @returns {Promise<boolean>} - Var mı
 */
const hasCache = async (key) => {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Redis has cache error:', error);
    return false;
  }
};

/**
 * Önbelleğe alma veya alma
 * @param {string} key - Önbellek anahtarı
 * @param {Function} fallbackFn - Önbellekte yoksa çağrılacak fonksiyon
 * @param {number} ttl - Önbellek süresi (saniye)
 * @returns {Promise<any>} - Veri
 */
const getCacheOrSet = async (key, fallbackFn, ttl = TTL.MEDIUM) => {
  try {
    const cachedData = await getCache(key);
    
    if (cachedData !== null) {
      return cachedData;
    }
    
    const data = await fallbackFn();
    
    if (data !== null && data !== undefined) {
      await setCache(key, data, ttl);
    }
    
    return data;
  } catch (error) {
    console.error('Redis get cache or set error:', error);
    return fallbackFn();
  }
};

// Pub/Sub işlemleri
const pubSub = {
  /**
   * Kanala abone olma
   * @param {string} channel - Kanal adı
   * @param {Function} callback - Geri çağırma fonksiyonu
   * @returns {Promise<boolean>} - İşlem başarılı mı
   */
  subscribe: async (channel, callback) => {
    try {
      const client = getRedisClient();
      await client.subscribe(channel);
      
      client.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const data = JSON.parse(message);
            callback(data);
          } catch (e) {
            callback(message);
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Redis subscribe error:', error);
      return false;
    }
  },
  
  /**
   * Kanaldan aboneliği iptal etme
   * @param {string} channel - Kanal adı
   * @returns {Promise<boolean>} - İşlem başarılı mı
   */
  unsubscribe: async (channel) => {
    try {
      const client = getRedisClient();
      await client.unsubscribe(channel);
      return true;
    } catch (error) {
      console.error('Redis unsubscribe error:', error);
      return false;
    }
  },
  
  /**
   * Kanala mesaj yayınlama
   * @param {string} channel - Kanal adı
   * @param {any} message - Mesaj
   * @returns {Promise<boolean>} - İşlem başarılı mı
   */
  publish: async (channel, message) => {
    try {
      const client = getRedisClient();
      const value = typeof message === 'string' ? message : JSON.stringify(message);
      await client.publish(channel, value);
      return true;
    } catch (error) {
      console.error('Redis publish error:', error);
      return false;
    }
  },
};

module.exports = {
  initRedis,
  getRedisClient,
  closeRedis,
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPrefix,
  flushCache,
  extendCacheTTL,
  getCacheTTL,
  hasCache,
  getCacheOrSet,
  pubSub,
  TTL,
}; 