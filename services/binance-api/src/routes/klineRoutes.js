const express = require('express');
const { getKlines } = require('../utils/binanceClient');
const { checkApiKey, checkRateLimit } = require('../middleware/authMiddleware');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/binance/kline/:symbol
 * @desc Get klines (candlestick) data for a symbol
 * @access Public
 */
router.get('/:symbol', checkRateLimit, async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 500 } = req.query;
    
    if (!symbol) {
      return next(new ApiError(400, 'Symbol is required'));
    }
    
    // Validate interval
    const validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
    if (!validIntervals.includes(interval)) {
      return next(new ApiError(400, `Invalid interval. Valid intervals are: ${validIntervals.join(', ')}`));
    }
    
    // Validate limit
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      return next(new ApiError(400, 'Limit must be a number between 1 and 1000'));
    }
    
    const klines = await getKlines(symbol.toUpperCase(), interval, parsedLimit);
    
    // Format the response
    const formattedKlines = klines.map(kline => ({
      openTime: kline.openTime,
      open: kline.open,
      high: kline.high,
      low: kline.low,
      close: kline.close,
      volume: kline.volume,
      closeTime: kline.closeTime,
      quoteAssetVolume: kline.quoteAssetVolume,
      trades: kline.trades,
      buyBaseAssetVolume: kline.buyBaseAssetVolume,
      buyQuoteAssetVolume: kline.buyQuoteAssetVolume
    }));
    
    res.status(200).json({
      status: 'success',
      symbol: symbol.toUpperCase(),
      interval,
      count: formattedKlines.length,
      data: formattedKlines
    });
  } catch (error) {
    logger.error(`Get klines error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching klines data'));
  }
});

/**
 * @route GET /api/binance/kline/:symbol/:interval
 * @desc Get klines (candlestick) data for a symbol with specific interval
 * @access Public
 */
router.get('/:symbol/:interval', checkRateLimit, async (req, res, next) => {
  try {
    const { symbol, interval } = req.params;
    const { limit = 500 } = req.query;
    
    if (!symbol) {
      return next(new ApiError(400, 'Symbol is required'));
    }
    
    // Validate interval
    const validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
    if (!validIntervals.includes(interval)) {
      return next(new ApiError(400, `Invalid interval. Valid intervals are: ${validIntervals.join(', ')}`));
    }
    
    // Validate limit
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      return next(new ApiError(400, 'Limit must be a number between 1 and 1000'));
    }
    
    const klines = await getKlines(symbol.toUpperCase(), interval, parsedLimit);
    
    // Format the response
    const formattedKlines = klines.map(kline => ({
      openTime: kline.openTime,
      open: kline.open,
      high: kline.high,
      low: kline.low,
      close: kline.close,
      volume: kline.volume,
      closeTime: kline.closeTime,
      quoteAssetVolume: kline.quoteAssetVolume,
      trades: kline.trades,
      buyBaseAssetVolume: kline.buyBaseAssetVolume,
      buyQuoteAssetVolume: kline.buyQuoteAssetVolume
    }));
    
    res.status(200).json({
      status: 'success',
      symbol: symbol.toUpperCase(),
      interval,
      count: formattedKlines.length,
      data: formattedKlines
    });
  } catch (error) {
    logger.error(`Get klines error: ${error.message}`);
    return next(new ApiError(500, 'Error fetching klines data'));
  }
});

module.exports = router; 