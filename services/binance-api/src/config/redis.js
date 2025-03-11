const Redis = require('ioredis');
const logger = require('../utils/logger');

// Redis client
let redisClient;

/**
 * Connect to Redis
 */
const connectRedis = () => {
  try {
    // Create Redis client
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    // Redis events
    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting');
    });

    return redisClient;
  } catch (error) {
    logger.error(`Redis connection error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Get Redis client
 */
const getRedisClient = () => {
  if (!redisClient) {
    connectRedis();
  }
  return redisClient;
};

/**
 * Set data in Redis with TTL
 */
const setCache = async (key, data, ttl = 60) => {
  try {
    const client = getRedisClient();
    await client.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error(`Redis setCache error: ${error.message}`);
    return false;
  }
};

/**
 * Get data from Redis
 */
const getCache = async (key) => {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Redis getCache error: ${error.message}`);
    return null;
  }
};

/**
 * Delete data from Redis
 */
const deleteCache = async (key) => {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis deleteCache error: ${error.message}`);
    return false;
  }
};

/**
 * Clear all data from Redis
 */
const clearCache = async () => {
  try {
    const client = getRedisClient();
    await client.flushall();
    return true;
  } catch (error) {
    logger.error(`Redis clearCache error: ${error.message}`);
    return false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  clearCache
}; 