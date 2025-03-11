const express = require('express');
const { getDepth } = require('../utils/binanceClient');
const { checkApiKey, checkRateLimit } = require('../middleware/authMiddleware');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/binance/depth/:symbol
 * @desc Get order book (depth) for a symbol
 * @access Public
 */
router.get('/:symbol', checkRateLimit, async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { limit = 100 } = req.query;
    
    if (!symbol) {
      return next(new ApiError(400, 'Symbol is required'));
    }
    
    // Validate limit
    const validLimits = [5, 10, 20, 50, 100, 500, 1000];
    const parsedLimit = parseInt(limit);
    
    if (isNaN(parsedLimit) || !validLimits.includes(parsedLimit)) {
      return next(new ApiError(400, `Invalid limit. Valid limits are: ${validLimits.join(', ')}`));
    }
    
    const depth = await getDepth(symbol.toUpperCase(), parsedLimit);
    
    res.status(200).json({
      status: 'success',
      symbol: symbol.toUpperCase(),
      limit: parsedLimit,
      data: depth
    });
  } catch (error) {
    logger.error(`Get depth error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching order book data'));
  }
});

/**
 * @route GET /api/binance/depth/:symbol/:limit
 * @desc Get order book (depth) for a symbol with specific limit
 * @access Public
 */
router.get('/:symbol/:limit', checkRateLimit, async (req, res, next) => {
  try {
    const { symbol, limit } = req.params;
    
    if (!symbol) {
      return next(new ApiError(400, 'Symbol is required'));
    }
    
    // Validate limit
    const validLimits = [5, 10, 20, 50, 100, 500, 1000];
    const parsedLimit = parseInt(limit);
    
    if (isNaN(parsedLimit) || !validLimits.includes(parsedLimit)) {
      return next(new ApiError(400, `Invalid limit. Valid limits are: ${validLimits.join(', ')}`));
    }
    
    const depth = await getDepth(symbol.toUpperCase(), parsedLimit);
    
    res.status(200).json({
      status: 'success',
      symbol: symbol.toUpperCase(),
      limit: parsedLimit,
      data: depth
    });
  } catch (error) {
    logger.error(`Get depth error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching order book data'));
  }
});

module.exports = router; 