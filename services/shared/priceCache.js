/**
 * Fiyat Önbellek Modülü
 * 
 * Bu modül, fiyat verilerini Redis önbelleğinde saklamak ve yönetmek için
 * kullanılır. Eşik değerlerine göre önbellek güncellemelerini yönetir ve
 * gereksiz güncellemeleri önler.
 */

const Redis = require('ioredis');
const { promisify } = require('util');
const logger = require('./logger');

// Redis bağlantısı
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Redis bağlantı olayları
redis.on('connect', () => {
  logger.info('Redis bağlantısı kuruldu');
});

redis.on('error', (err) => {
  logger.error(`Redis bağlantı hatası: ${err.message}`);
});

// Önbellek anahtarları
const CACHE_KEYS = {
  TICKER: 'ticker',
  KLINES: 'klines',
  DEPTH: 'depth',
  TRADES: 'trades',
  THRESHOLDS: 'thresholds',
};

// Varsayılan eşik değerleri
const DEFAULT_THRESHOLDS = {
  price: 0.1, // %0.1 fiyat değişimi
  volume: 1.0, // %1 hacim değişimi
};

// Varsayılan TTL değerleri (saniye)
const DEFAULT_TTL = {
  TICKER: 60,
  KLINES: 300,
  DEPTH: 10,
  TRADES: 30,
};

// Eşik değerlerini al
async function getThresholds() {
  try {
    const thresholds = await redis.get(`${CACHE_KEYS.THRESHOLDS}`);
    return thresholds ? JSON.parse(thresholds) : DEFAULT_THRESHOLDS;
  } catch (error) {
    logger.error(`Eşik değerleri alınırken hata: ${error.message}`);
    return DEFAULT_THRESHOLDS;
  }
}

// Eşik değerlerini ayarla
async function setThresholds(thresholds) {
  try {
    const newThresholds = {
      ...DEFAULT_THRESHOLDS,
      ...thresholds,
    };
    
    await redis.set(
      `${CACHE_KEYS.THRESHOLDS}`,
      JSON.stringify(newThresholds)
    );
    
    logger.info(`Eşik değerleri güncellendi: ${JSON.stringify(newThresholds)}`);
    return newThresholds;
  } catch (error) {
    logger.error(`Eşik değerleri ayarlanırken hata: ${error.message}`);
    throw error;
  }
}

// Fiyat değişimini kontrol et
async function shouldUpdatePrice(symbol, newPrice, type = CACHE_KEYS.TICKER) {
  try {
    // Eşik değerlerini al
    const thresholds = await getThresholds();
    
    // Önbellekteki son fiyatı al
    const cacheKey = `${type}:${symbol}`;
    const cachedData = await redis.get(cacheKey);
    
    // Önbellekte veri yoksa, güncelle
    if (!cachedData) {
      return true;
    }
    
    const cachedPrice = JSON.parse(cachedData);
    
    // Fiyat değişimini hesapla
    let shouldUpdate = false;
    
    // Ticker verisi için
    if (type === CACHE_KEYS.TICKER) {
      // Fiyat değişimi
      if (newPrice.price && cachedPrice.price) {
        const priceChange = Math.abs(
          (parseFloat(newPrice.price) - parseFloat(cachedPrice.price)) /
            parseFloat(cachedPrice.price) *
            100
        );
        
        if (priceChange >= thresholds.price) {
          shouldUpdate = true;
        }
      }
      
      // Hacim değişimi
      if (newPrice.volume && cachedPrice.volume) {
        const volumeChange = Math.abs(
          (parseFloat(newPrice.volume) - parseFloat(cachedPrice.volume)) /
            parseFloat(cachedPrice.volume) *
            100
        );
        
        if (volumeChange >= thresholds.volume) {
          shouldUpdate = true;
        }
      }
    }
    // Kline verisi için
    else if (type === CACHE_KEYS.KLINES) {
      // Son kline'ı kontrol et
      const lastNewKline = newPrice[newPrice.length - 1];
      const lastCachedKline = cachedPrice[cachedPrice.length - 1];
      
      if (lastNewKline && lastCachedKline) {
        // Kapanış fiyatı değişimi
        const closeChange = Math.abs(
          (parseFloat(lastNewKline.close) - parseFloat(lastCachedKline.close)) /
            parseFloat(lastCachedKline.close) *
            100
        );
        
        if (closeChange >= thresholds.price) {
          shouldUpdate = true;
        }
        
        // Hacim değişimi
        const volumeChange = Math.abs(
          (parseFloat(lastNewKline.volume) - parseFloat(lastCachedKline.volume)) /
            parseFloat(lastCachedKline.volume) *
            100
        );
        
        if (volumeChange >= thresholds.volume) {
          shouldUpdate = true;
        }
      }
    }
    // Derinlik verisi için
    else if (type === CACHE_KEYS.DEPTH) {
      // Her zaman güncelle
      shouldUpdate = true;
    }
    // İşlem verisi için
    else if (type === CACHE_KEYS.TRADES) {
      // Her zaman güncelle
      shouldUpdate = true;
    }
    
    return shouldUpdate;
  } catch (error) {
    logger.error(`Fiyat değişimi kontrol edilirken hata: ${error.message}`);
    return true; // Hata durumunda güncelle
  }
}

// Fiyat verisini önbelleğe al
async function cachePriceData(symbol, data, type = CACHE_KEYS.TICKER) {
  try {
    // Veriyi önbelleğe al
    const cacheKey = `${type}:${symbol}`;
    
    // TTL değerini belirle
    let ttl = DEFAULT_TTL[type.toUpperCase()] || 60;
    
    // Veriyi önbelleğe al
    await redis.set(cacheKey, JSON.stringify(data), 'EX', ttl);
    
    logger.debug(`Fiyat verisi önbelleğe alındı: ${cacheKey}`);
    return true;
  } catch (error) {
    logger.error(`Fiyat verisi önbelleğe alınırken hata: ${error.message}`);
    return false;
  }
}

// Önbellekteki fiyat verisini al
async function getCachedPriceData(symbol, type = CACHE_KEYS.TICKER) {
  try {
    // Önbellekteki veriyi al
    const cacheKey = `${type}:${symbol}`;
    const cachedData = await redis.get(cacheKey);
    
    if (!cachedData) {
      return null;
    }
    
    return JSON.parse(cachedData);
  } catch (error) {
    logger.error(`Önbellekteki fiyat verisi alınırken hata: ${error.message}`);
    return null;
  }
}

// Önbellekteki fiyat verisini sil
async function clearPriceCache(symbol, type = CACHE_KEYS.TICKER) {
  try {
    // Önbellekteki veriyi sil
    const cacheKey = `${type}:${symbol}`;
    await redis.del(cacheKey);
    
    logger.info(`Fiyat önbelleği temizlendi: ${cacheKey}`);
    return true;
  } catch (error) {
    logger.error(`Fiyat önbelleği temizlenirken hata: ${error.message}`);
    return false;
  }
}

// Tüm fiyat önbelleklerini temizle
async function clearAllPriceCaches() {
  try {
    // Tüm önbellek anahtarlarını al
    const keys = await redis.keys('ticker:*');
    keys.push(...await redis.keys('klines:*'));
    keys.push(...await redis.keys('depth:*'));
    keys.push(...await redis.keys('trades:*'));
    
    if (keys.length > 0) {
      // Tüm anahtarları sil
      await redis.del(...keys);
    }
    
    logger.info(`Tüm fiyat önbellekleri temizlendi (${keys.length} anahtar)`);
    return true;
  } catch (error) {
    logger.error(`Tüm fiyat önbellekleri temizlenirken hata: ${error.message}`);
    return false;
  }
}

// Ticker önbelleklerini temizle
async function clearTickerCaches() {
  try {
    // Ticker önbellek anahtarlarını al
    const keys = await redis.keys('ticker:*');
    
    if (keys.length > 0) {
      // Tüm anahtarları sil
      await redis.del(...keys);
    }
    
    logger.info(`Ticker önbellekleri temizlendi (${keys.length} anahtar)`);
    return true;
  } catch (error) {
    logger.error(`Ticker önbellekleri temizlenirken hata: ${error.message}`);
    return false;
  }
}

// TTL değerlerini ayarla
async function setCacheTTL(ttlValues) {
  try {
    // Mevcut TTL değerlerini al
    const currentTTL = { ...DEFAULT_TTL };
    
    // Yeni TTL değerlerini ayarla
    Object.keys(ttlValues).forEach((key) => {
      if (DEFAULT_TTL[key] !== undefined) {
        currentTTL[key] = ttlValues[key];
      }
    });
    
    // TTL değerlerini önbelleğe al
    await redis.set('cache:ttl', JSON.stringify(currentTTL));
    
    logger.info(`TTL değerleri güncellendi: ${JSON.stringify(currentTTL)}`);
    return currentTTL;
  } catch (error) {
    logger.error(`TTL değerleri ayarlanırken hata: ${error.message}`);
    throw error;
  }
}

// TTL değerlerini al
async function getCacheTTL() {
  try {
    // Önbellekteki TTL değerlerini al
    const cachedTTL = await redis.get('cache:ttl');
    
    if (!cachedTTL) {
      return DEFAULT_TTL;
    }
    
    return JSON.parse(cachedTTL);
  } catch (error) {
    logger.error(`TTL değerleri alınırken hata: ${error.message}`);
    return DEFAULT_TTL;
  }
}

// Önbellek durumunu al
async function getCacheStatus() {
  try {
    // Redis bilgilerini al
    const info = await redis.info();
    
    // Bilgileri parse et
    const infoObj = {};
    info.split('\r\n').forEach((line) => {
      const parts = line.split(':');
      if (parts.length === 2) {
        infoObj[parts[0]] = parts[1];
      }
    });
    
    // TTL değerlerini al
    const ttl = await getCacheTTL();
    
    // Eşik değerlerini al
    const thresholds = await getThresholds();
    
    // Önbellek durumunu oluştur
    const status = {
      connected: true,
      info: {
        redis_version: infoObj.redis_version,
        uptime_in_seconds: infoObj.uptime_in_seconds,
        connected_clients: infoObj.connected_clients,
        used_memory_human: infoObj.used_memory_human,
        total_system_memory_human: infoObj.total_system_memory_human,
        used_memory_peak_human: infoObj.used_memory_peak_human,
      },
      ttl,
      thresholds,
    };
    
    return status;
  } catch (error) {
    logger.error(`Önbellek durumu alınırken hata: ${error.message}`);
    return {
      connected: false,
      info: {},
      ttl: DEFAULT_TTL,
      thresholds: DEFAULT_THRESHOLDS,
    };
  }
}

module.exports = {
  redis,
  CACHE_KEYS,
  DEFAULT_THRESHOLDS,
  DEFAULT_TTL,
  getThresholds,
  setThresholds,
  shouldUpdatePrice,
  cachePriceData,
  getCachedPriceData,
  clearPriceCache,
  clearAllPriceCaches,
  clearTickerCaches,
  setCacheTTL,
  getCacheTTL,
  getCacheStatus,
}; 