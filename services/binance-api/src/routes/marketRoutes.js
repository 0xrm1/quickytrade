const express = require('express');
const { getExchangeInfo } = require('../utils/binanceClient');
const { checkApiKey, checkRateLimit } = require('../middleware/authMiddleware');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/binance/market/exchange-info
 * @desc Get exchange information
 * @access Public
 */
router.get('/exchange-info', checkRateLimit, async (req, res, next) => {
  try {
    const exchangeInfo = await getExchangeInfo();
    
    res.status(200).json({
      status: 'success',
      data: exchangeInfo
    });
  } catch (error) {
    logger.error(`Get exchange info error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching exchange information'));
  }
});

/**
 * @route GET /api/binance/market/symbols
 * @desc Get all symbols
 * @access Public
 */
router.get('/symbols', checkRateLimit, async (req, res, next) => {
  try {
    const exchangeInfo = await getExchangeInfo();
    const symbols = exchangeInfo.symbols.map(symbol => ({
      symbol: symbol.symbol,
      baseAsset: symbol.baseAsset,
      quoteAsset: symbol.quoteAsset,
      status: symbol.status
    }));
    
    res.status(200).json({
      status: 'success',
      count: symbols.length,
      data: symbols
    });
  } catch (error) {
    logger.error(`Get symbols error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching symbols'));
  }
});

/**
 * @route GET /api/binance/market/symbol/:symbol
 * @desc Get symbol details
 * @access Public
 */
router.get('/symbol/:symbol', checkRateLimit, async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return next(new ApiError(400, 'Symbol is required'));
    }
    
    const exchangeInfo = await getExchangeInfo();
    const symbolInfo = exchangeInfo.symbols.find(s => s.symbol === symbol.toUpperCase());
    
    if (!symbolInfo) {
      return next(new ApiError(404, `Symbol ${symbol} not found`));
    }
    
    res.status(200).json({
      status: 'success',
      data: symbolInfo
    });
  } catch (error) {
    logger.error(`Get symbol details error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching symbol details'));
  }
});

/**
 * @route GET /api/binance/market/assets
 * @desc Get all assets
 * @access Public
 */
router.get('/assets', checkRateLimit, async (req, res, next) => {
  try {
    const exchangeInfo = await getExchangeInfo();
    
    // Extract unique assets
    const assets = new Set();
    exchangeInfo.symbols.forEach(symbol => {
      assets.add(symbol.baseAsset);
      assets.add(symbol.quoteAsset);
    });
    
    res.status(200).json({
      status: 'success',
      count: assets.size,
      data: Array.from(assets)
    });
  } catch (error) {
    logger.error(`Get assets error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching assets'));
  }
});

module.exports = router; 