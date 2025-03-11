/**
 * redis/index.js
 * 
 * Bu modül, Redis bağlantısını yönetir ve Redis istemcisini dışa aktarır.
 * Uygulama genelinde kullanılacak olan Redis bağlantısını sağlar.
 */

const Redis = require('ioredis');
let redisClient = null;

/**
 * Redis bağlantısını başlatır
 * @param {string} url - Redis bağlantı URL'si
 * @returns {Promise<Redis>} - Redis istemcisi
 */
const initRedis = async (url) => {
  try {
    // Mevcut bağlantıyı kapat
    if (redisClient) {
      await redisClient.quit();
    }

    // Yeni bağlantı oluştur
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Sadece READONLY hatası için yeniden bağlan
          return true;
        }
        return false;
      }
    });

    // Bağlantı olaylarını dinle
    redisClient.on('connect', () => {
      console.log('Redis bağlantısı kuruldu');
    });

    redisClient.on('ready', () => {
      console.log('Redis kullanıma hazır');
    });

    redisClient.on('error', (err) => {
      console.error('Redis hatası:', err);
    });

    redisClient.on('close', () => {
      console.log('Redis bağlantısı kapatıldı');
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis yeniden bağlanıyor...');
    });

    // Bağlantıyı test et
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    console.error('Redis bağlantı hatası:', error);
    throw error;
  }
};

/**
 * Redis bağlantısını kapatır
 * @returns {Promise<void>}
 */
const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis bağlantısı düzgün şekilde kapatıldı');
    } catch (error) {
      console.error('Redis bağlantısı kapatılırken hata:', error);
      // Zorla kapat
      redisClient.disconnect();
    } finally {
      redisClient = null;
    }
  }
};

/**
 * Redis istemcisini döndürür
 * @returns {Redis|null} - Redis istemcisi veya null
 */
const getRedisClient = () => {
  if (!redisClient) {
    console.warn('Redis istemcisi henüz başlatılmadı');
  }
  return redisClient;
};

/**
 * Redis bağlantı durumunu kontrol eder
 * @returns {Promise<Object>} - Bağlantı durumu
 */
const checkRedisStatus = async () => {
  if (!redisClient) {
    return {
      connected: false,
      message: 'Redis istemcisi başlatılmadı',
    };
  }

  try {
    const ping = await redisClient.ping();
    const info = await redisClient.info();
    
    // Info'dan bazı önemli bilgileri çıkar
    const infoLines = info.split('\r\n');
    const infoObj = {};
    
    infoLines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        infoObj[key] = value;
      }
    });
    
    return {
      connected: ping === 'PONG',
      message: 'Redis bağlantısı aktif',
      info: {
        version: infoObj.redis_version,
        uptime: infoObj.uptime_in_seconds,
        clients: infoObj.connected_clients,
        memory: infoObj.used_memory_human,
        peak_memory: infoObj.used_memory_peak_human,
      }
    };
  } catch (error) {
    return {
      connected: false,
      message: `Redis bağlantı hatası: ${error.message}`,
      error: error.message,
    };
  }
};

module.exports = {
  initRedis,
  closeRedis,
  getRedisClient,
  checkRedisStatus,
}; 