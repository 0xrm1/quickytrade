const express = require('express');
const { getTickerPrice, getTicker24hr } = require('../utils/binanceClient');
const { checkApiKey, checkRateLimit } = require('../middleware/authMiddleware');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/binance/ticker/price
 * @desc Get ticker price for all symbols or a specific symbol
 * @access Public
 */
router.get('/price', checkRateLimit, async (req, res, next) => {
  try {
    const { symbol } = req.query;
    
    const tickerPrice = await getTickerPrice(symbol);
    
    res.status(200).json({
      status: 'success',
      data: tickerPrice
    });
  } catch (error) {
    logger.error(`Get ticker price error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching ticker price'));
  }
});

/**
 * @route GET /api/binance/ticker/price/:symbol
 * @desc Get ticker price for a specific symbol
 * @access Public
 */
router.get('/price/:symbol', checkRateLimit, async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return next(new ApiError(400, 'Symbol is required'));
    }
    
    const tickerPrice = await getTickerPrice(symbol.toUpperCase());
    
    res.status(200).json({
      status: 'success',
      data: tickerPrice
    });
  } catch (error) {
    logger.error(`Get ticker price error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching ticker price'));
  }
});

/**
 * @route GET /api/binance/ticker/24hr
 * @desc Get 24hr ticker for all symbols or a specific symbol
 * @access Public
 */
router.get('/24hr', checkRateLimit, async (req, res, next) => {
  try {
    const { symbol } = req.query;
    
    const ticker24hr = await getTicker24hr(symbol);
    
    res.status(200).json({
      status: 'success',
      data: ticker24hr
    });
  } catch (error) {
    logger.error(`Get ticker 24hr error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching 24hr ticker'));
  }
});

/**
 * @route GET /api/binance/ticker/24hr/:symbol
 * @desc Get 24hr ticker for a specific symbol
 * @access Public
 */
router.get('/24hr/:symbol', checkRateLimit, async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return next(new ApiError(400, 'Symbol is required'));
    }
    
    const ticker24hr = await getTicker24hr(symbol.toUpperCase());
    
    res.status(200).json({
      status: 'success',
      data: ticker24hr
    });
  } catch (error) {
    logger.error(`Get ticker 24hr error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching 24hr ticker'));
  }
});

module.exports = router; 