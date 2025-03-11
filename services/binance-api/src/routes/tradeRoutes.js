const express = require('express');
const { getTrades } = require('../utils/binanceClient');
const { checkApiKey, checkRateLimit } = require('../middleware/authMiddleware');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/binance/trade/:symbol
 * @desc Get recent trades for a symbol
 * @access Public
 */
router.get('/:symbol', checkRateLimit, async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { limit = 500 } = req.query;
    
    if (!symbol) {
      return next(new ApiError(400, 'Symbol is required'));
    }
    
    // Validate limit
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      return next(new ApiError(400, 'Limit must be a number between 1 and 1000'));
    }
    
    const trades = await getTrades(symbol.toUpperCase(), parsedLimit);
    
    res.status(200).json({
      status: 'success',
      symbol: symbol.toUpperCase(),
      count: trades.length,
      data: trades
    });
  } catch (error) {
    logger.error(`Get trades error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching trades data'));
  }
});

/**
 * @route GET /api/binance/trade/:symbol/:limit
 * @desc Get recent trades for a symbol with specific limit
 * @access Public
 */
router.get('/:symbol/:limit', checkRateLimit, async (req, res, next) => {
  try {
    const { symbol, limit } = req.params;
    
    if (!symbol) {
      return next(new ApiError(400, 'Symbol is required'));
    }
    
    // Validate limit
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      return next(new ApiError(400, 'Limit must be a number between 1 and 1000'));
    }
    
    const trades = await getTrades(symbol.toUpperCase(), parsedLimit);
    
    res.status(200).json({
      status: 'success',
      symbol: symbol.toUpperCase(),
      count: trades.length,
      data: trades
    });
  } catch (error) {
    logger.error(`Get trades error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching trades data'));
  }
});

module.exports = router;