/**
 * cache.js
 * 
 * Bu dosya, API yanıtları için yerel önbellek yönetimi sağlar.
 * React Query'nin önbelleğine ek olarak, tarayıcı localStorage'ı kullanarak
 * çevrimdışı erişim ve daha uzun süreli önbelleğe alma sağlar.
 */

// Önbellek anahtarı öneki
const CACHE_PREFIX = 'quickytrade_cache_';

// Önbellek TTL (Time To Live) değerleri (milisaniye cinsinden)
const TTL = {
  SHORT: 5 * 60 * 1000, // 5 dakika
  MEDIUM: 30 * 60 * 1000, // 30 dakika
  LONG: 24 * 60 * 60 * 1000, // 1 gün
};

/**
 * Veriyi önbelleğe alma
 * @param {string} key - Önbellek anahtarı
 * @param {any} data - Önbelleğe alınacak veri
 * @param {number} ttl - Önbellek süresi (milisaniye)
 */
const setCache = (key, data, ttl = TTL.MEDIUM) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheData = {
      data,
      expiry: Date.now() + ttl,
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

/**
 * Önbellekten veri alma
 * @param {string} key - Önbellek anahtarı
 * @returns {any|null} - Önbellekteki veri veya null
 */
const getCache = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheItem = localStorage.getItem(cacheKey);
    
    if (!cacheItem) return null;
    
    const { data, expiry } = JSON.parse(cacheItem);
    
    // Önbellek süresi dolmuşsa null döndür
    if (Date.now() > expiry) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Önbellekten veriyi silme
 * @param {string} key - Önbellek anahtarı
 */
const removeCache = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
    return true;
  } catch (error) {
    console.error('Cache remove error:', error);
    return false;
  }
};

/**
 * Belirli bir önekle başlayan tüm önbellek öğelerini silme
 * @param {string} prefix - Önbellek anahtarı öneki
 */
const clearCacheByPrefix = (prefix) => {
  try {
    const fullPrefix = `${CACHE_PREFIX}${prefix}`;
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(fullPrefix)) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Cache clear by prefix error:', error);
    return false;
  }
};

/**
 * Tüm önbelleği temizleme
 */
const clearAllCache = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Cache clear all error:', error);
    return false;
  }
};

/**
 * Süresi dolmuş önbellek öğelerini temizleme
 */
const cleanExpiredCache = () => {
  try {
    const now = Date.now();
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cacheItem = JSON.parse(localStorage.getItem(key));
          if (cacheItem && cacheItem.expiry && now > cacheItem.expiry) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Geçersiz JSON, öğeyi sil
          localStorage.removeItem(key);
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('Cache clean expired error:', error);
    return false;
  }
};

// Periyodik olarak süresi dolmuş önbellek öğelerini temizle
// Sayfa yüklendiğinde ve her saat başı çalışır
if (typeof window !== 'undefined') {
  cleanExpiredCache();
  setInterval(cleanExpiredCache, 60 * 60 * 1000); // Her saat
}

const cache = {
  set: setCache,
  get: getCache,
  remove: removeCache,
  clearByPrefix: clearCacheByPrefix,
  clearAll: clearAllCache,
  TTL,
};

export default cache; 