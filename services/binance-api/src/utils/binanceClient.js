const Binance = require('node-binance-api');
const logger = require('./logger');
const { setCache, getCache } = require('../config/redis');

/**
 * Create Binance API client
 */
const createBinanceClient = (apiKey = '', apiSecret = '') => {
  try {
    // Use provided API keys or fallback to environment variables
    const key = apiKey || process.env.BINANCE_API_KEY || '';
    const secret = apiSecret || process.env.BINANCE_API_SECRET || '';
    
    // Create Binance client
    const binance = new Binance().options({
      APIKEY: key,
      APISECRET: secret,
      useServerTime: true,
      recvWindow: 60000, // Set a higher recvWindow to avoid timestamp errors
      verbose: process.env.NODE_ENV === 'development',
      log: (log) => {
        logger.debug(log);
      }
    });
    
    return binance;
  } catch (error) {
    logger.error(`Binance client creation error: ${error.message}`);
    throw error;
  }
};

/**
 * Get exchange info with caching
 */
const getExchangeInfo = async () => {
  try {
    // Try to get from cache first
    const cacheKey = 'binance:exchangeInfo';
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, fetch from API
    const binance = createBinanceClient();
    const exchangeInfo = await binance.exchangeInfo();
    
    // Cache the result for 1 hour (3600 seconds)
    await setCache(cacheKey, exchangeInfo, 3600);
    
    return exchangeInfo;
  } catch (error) {
    logger.error(`Get exchange info error: ${error.message}`);
    throw error;
  }
};

/**
 * Get ticker price with caching
 */
const getTickerPrice = async (symbol) => {
  try {
    // Try to get from cache first
    const cacheKey = `binance:ticker:${symbol || 'all'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, fetch from API
    const binance = createBinanceClient();
    const tickerPrice = symbol 
      ? await binance.prices(symbol)
      : await binance.prices();
    
    // Cache the result for 5 seconds
    await setCache(cacheKey, tickerPrice, 5);
    
    return tickerPrice;
  } catch (error) {
    logger.error(`Get ticker price error: ${error.message}`);
    throw error;
  }
};

/**
 * Get ticker 24hr with caching
 */
const getTicker24hr = async (symbol) => {
  try {
    // Try to get from cache first
    const cacheKey = `binance:ticker24hr:${symbol || 'all'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, fetch from API
    const binance = createBinanceClient();
    const ticker24hr = symbol 
      ? await binance.prevDay(symbol)
      : await binance.prevDay();
    
    // Cache the result for 5 seconds
    await setCache(cacheKey, ticker24hr, 5);
    
    return ticker24hr;
  } catch (error) {
    logger.error(`Get ticker 24hr error: ${error.message}`);
    throw error;
  }
};

/**
 * Get klines (candlestick) data with caching
 */
const getKlines = async (symbol, interval, limit = 500) => {
  try {
    // Try to get from cache first
    const cacheKey = `binance:klines:${symbol}:${interval}:${limit}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, fetch from API
    const binance = createBinanceClient();
    const klines = await binance.candlesticks(symbol, interval, false, { limit });
    
    // Cache the result for 5 seconds
    await setCache(cacheKey, klines, 5);
    
    return klines;
  } catch (error) {
    logger.error(`Get klines error: ${error.message}`);
    throw error;
  }
};

/**
 * Get order book (depth) with caching
 */
const getDepth = async (symbol, limit = 100) => {
  try {
    // Try to get from cache first
    const cacheKey = `binance:depth:${symbol}:${limit}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, fetch from API
    const binance = createBinanceClient();
    const depth = await binance.depth(symbol, { limit });
    
    // Cache the result for 2 seconds
    await setCache(cacheKey, depth, 2);
    
    return depth;
  } catch (error) {
    logger.error(`Get depth error: ${error.message}`);
    throw error;
  }
};

/**
 * Get recent trades with caching
 */
const getTrades = async (symbol, limit = 500) => {
  try {
    // Try to get from cache first
    const cacheKey = `binance:trades:${symbol}:${limit}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, fetch from API
    const binance = createBinanceClient();
    const trades = await binance.trades(symbol, { limit });
    
    // Cache the result for 5 seconds
    await setCache(cacheKey, trades, 5);
    
    return trades;
  } catch (error) {
    logger.error(`Get trades error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createBinanceClient,
  getExchangeInfo,
  getTickerPrice,
  getTicker24hr,
  getKlines,
  getDepth,
  getTrades
}; 