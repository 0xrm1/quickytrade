const express = require('express');
const router = express.Router();
const Binance = require('binance-api-node').default;
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const authUtils = require('../utils/authUtils');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Helper function to create a Binance client with user's API keys
 * @param {Object} req - Express request object containing user info
 * @returns {Object} Binance client instance
 */
const createBinanceClient = async (req) => {
  try {
    // Get user's API keys from database
    const userId = req.user.id;
    const apiKeys = await User.getApiKeys(userId);
    
    if (!apiKeys || !apiKeys.binance_api_key || !apiKeys.binance_secret_key) {
      throw new Error('API keys not found for this user');
    }
    
    // Decrypt API keys
    const apiKey = authUtils.decryptData(apiKeys.binance_api_key);
    const secretKey = authUtils.decryptData(apiKeys.binance_secret_key);
    
    // Create and return Binance client
    return Binance({
      apiKey,
      apiSecret: secretKey,
      futures: true
    });
  } catch (error) {
    console.error('Error creating Binance client:', error);
    throw error;
  }
};

/**
 * Get symbol precision for accurate order quantity
 * @param {string} symbol - Trading symbol
 * @param {Object} binanceClient - Binance client instance
 * @returns {number} - Precision value
 */
async function getSymbolPrecision(symbol, binanceClient) {
  try {
    const exchangeInfo = await binanceClient.futuresExchangeInfo();
    const symbolInfo = exchangeInfo.symbols.find(s => s.symbol === symbol);
    
    if (!symbolInfo) {
      console.log(`${symbol} symbol not found.`);
      return 3; // Default value
    }
    
    // Find the correct precision value for the symbol
    const lotSizeFilter = symbolInfo.filters.find(filter => filter.filterType === 'LOT_SIZE');
    const stepSize = parseFloat(lotSizeFilter.stepSize);
    
    // Calculate decimal precision based on step size
    const precision = stepSize === 1 ? 0 : stepSize.toString().split('.')[1].length;
    
    console.log(`Symbol: ${symbol}, Step Size: ${stepSize}, Precision: ${precision}`);
    return precision;
  } catch (error) {
    console.error(`Precision not found: ${error.message}`);
    return 3; // Default value in case of error
  }
}

/**
 * Get all positions
 * @route GET /api/positions
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    console.log('Positions API called');
    
    // Create Binance client with user's API keys
    let binanceClient;
    try {
      binanceClient = await createBinanceClient(req);
    } catch (error) {
      return res.status(403).json({ 
        error: 'API keys not configured. Please add your Binance API keys in settings.'
      });
    }

    // Get positions
    const positions = await binanceClient.futuresPositionRisk();
    console.log('Futures Position Risk Response:', JSON.stringify(positions));
    
    // Filter only active positions (position amount != 0)
    const activePositions = positions.filter(p => parseFloat(p.positionAmt) !== 0);
    console.log('Active Positions:', JSON.stringify(activePositions));
    
    // Get detailed information for each position
    const enrichedPositions = await Promise.all(activePositions.map(async (position) => {
      try {
        // Get mark price
        console.log(`Getting mark price for ${position.symbol}...`);
        const markPriceData = await binanceClient.futuresMarkPrice({ symbol: position.symbol });
        console.log(`${position.symbol} Mark Price Data:`, markPriceData);
        const markPrice = parseFloat(markPriceData.markPrice || markPriceData.price || position.markPrice);
        
        // Position size
        const positionAmt = parseFloat(position.positionAmt);
        const side = positionAmt > 0 ? 'LONG' : 'SHORT';
        
        // Data directly from Binance
        const entryPrice = parseFloat(position.entryPrice);
        const leverage = parseFloat(position.leverage);
        
        // Liquidation price directly from Binance
        const liqPrice = parseFloat(position.liquidationPrice);
        
        // Profit/loss information directly from Binance
        const pnl = parseFloat(position.unRealizedProfit);
        
        // ROE (Return on Equity) calculation - official formula used by Binance
        let roe = 0;
        
        if (entryPrice > 0 && positionAmt !== 0) {
          // Calculate position value and margin
          const positionValue = Math.abs(positionAmt) * entryPrice;
          const margin = positionValue / leverage;
          
          if (margin > 0) {
            roe = (pnl / margin) * 100;
          }
        }
        
        return {
          symbol: position.symbol,
          side,
          positionAmt: positionAmt < 0 ? positionAmt * -1 : positionAmt, // Absolute value
          entryPrice,
          markPrice,
          liquidationPrice: liqPrice,
          leverage,
          unRealizedProfit: pnl,
          roe: roe.toFixed(2), // Send ROE to frontend
          marginType: position.marginType,
          // Add other useful information
          isolatedWallet: position.isolatedWallet,
          initialMargin: position.initialMargin,
          maintMargin: position.maintMargin
        };
      } catch (error) {
        console.error(`Position enrichment error (${position.symbol}):`, error);
        return position; // Return original position in case of error
      }
    }));
    
    // Format response to be compatible with frontend
    res.json({ positions: enrichedPositions });
  } catch (error) {
    console.error('Error getting positions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Close a position
 * @route POST /api/positions/close
 * @access Private
 */
router.post('/close', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol not specified' });
    }
    
    // Create Binance client with user's API keys
    let binanceClient;
    try {
      binanceClient = await createBinanceClient(req);
    } catch (error) {
      return res.status(403).json({ 
        error: 'API keys not configured. Please add your Binance API keys in settings.'
      });
    }
    
    // Get position information
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `No open position found for ${symbol}` });
    }
    
    const position = positions[0];
    const side = parseFloat(position.positionAmt) > 0 ? 'SELL' : 'BUY';
    const quantity = Math.abs(parseFloat(position.positionAmt));
    
    // Get precision for the symbol
    const precision = await getSymbolPrecision(symbol, binanceClient);
    
    console.log(`Closing position: ${symbol}, Quantity: ${quantity}, Precision: ${precision}`);
    
    // Close with market order
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'MARKET',
      quantity: quantity.toFixed(precision),
      reduceOnly: true
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      price: order.price,
      quantity: order.origQty,
      message: `Position closed: ${symbol}`
    });
  } catch (error) {
    console.error('Error closing position:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Close a partial position
 * @route POST /api/positions/close-partial
 * @access Private
 */
router.post('/close-partial', async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    
    if (!symbol || !quantity) {
      return res.status(400).json({ error: 'Symbol or quantity not specified' });
    }
    
    // Create Binance client with user's API keys
    let binanceClient;
    try {
      binanceClient = await createBinanceClient(req);
    } catch (error) {
      return res.status(403).json({ 
        error: 'API keys not configured. Please add your Binance API keys in settings.'
      });
    }
    
    // Get position information
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `No open position found for ${symbol}` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const totalQuantity = Math.abs(positionAmt);
    
    // Quantity to close should not be greater than total position quantity
    if (parseFloat(quantity) > totalQuantity) {
      return res.status(400).json({ 
        error: `Quantity to close (${quantity}) cannot be greater than total position quantity (${totalQuantity})` 
      });
    }
    
    // Get precision for the symbol
    const precision = await getSymbolPrecision(symbol, binanceClient);
    
    console.log(`Closing partial position: ${symbol}, Quantity: ${quantity}, Precision: ${precision}`);
    
    // Close with market order
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'MARKET',
      quantity: parseFloat(quantity).toFixed(precision),
      reduceOnly: true
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      price: order.price,
      quantity: order.origQty,
      message: `Partial position closed: ${symbol}, Quantity: ${quantity}`
    });
  } catch (error) {
    console.error('Error closing partial position:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 