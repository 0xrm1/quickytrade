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
 * Close a partial position with market order
 */
router.post('/close-partial', async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    
    if (!symbol || !quantity) {
      return res.status(400).json({ error: 'Symbol and quantity are required' });
    }
    
    // Create Binance client
    const binanceClient = await createBinanceClient(req);
    
    // Get position information
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `No open position found for ${symbol}` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    
    // Ensure quantity is not greater than position size
    const positionSize = Math.abs(positionAmt);
    if (quantity > positionSize) {
      return res.status(400).json({ error: `Quantity (${quantity}) exceeds position size (${positionSize})` });
    }
    
    // Get precision for the symbol
    const precision = await getSymbolPrecision(symbol, binanceClient);
    
    console.log(`Closing partial position: ${symbol}, Quantity: ${quantity}, Precision: ${precision}`);
    
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
      message: `Partial position closed: ${symbol}`
    });
  } catch (error) {
    console.error('Error closing partial position:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Place a limit order to close a position
 */
router.post('/limit-close', async (req, res) => {
  try {
    const { symbol, price, quantity } = req.body;
    
    if (!symbol || !price || !quantity) {
      return res.status(400).json({ error: 'Symbol, price and quantity are required' });
    }
    
    // Create Binance client
    const binanceClient = await createBinanceClient(req);
    
    // Get position information
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `No open position found for ${symbol}` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    
    // Ensure quantity is not greater than position size
    const positionSize = Math.abs(positionAmt);
    if (quantity > positionSize) {
      return res.status(400).json({ error: `Quantity (${quantity}) exceeds position size (${positionSize})` });
    }
    
    // Get precision for the symbol
    const precision = await getSymbolPrecision(symbol, binanceClient);
    
    console.log(`Placing limit order: ${symbol}, Price: ${price}, Quantity: ${quantity}, Precision: ${precision}`);
    
    // Place limit order
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'LIMIT',
      price: price,
      quantity: quantity.toFixed(precision),
      timeInForce: 'GTC',
      reduceOnly: true
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      price: order.price,
      quantity: order.origQty,
      message: `Limit order placed: ${symbol}`
    });
  } catch (error) {
    console.error('Error placing limit order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Place a stop market order to close a position
 */
router.post('/stop-close', async (req, res) => {
  try {
    const { symbol, stopPrice, quantity } = req.body;
    
    if (!symbol || !stopPrice || !quantity) {
      return res.status(400).json({ error: 'Symbol, stopPrice and quantity are required' });
    }
    
    // Create Binance client
    const binanceClient = await createBinanceClient(req);
    
    // Get position information
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `No open position found for ${symbol}` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const currentPrice = parseFloat(position.markPrice);
    
    // Validate stop price based on position side
    if (side === 'SELL' && parseFloat(stopPrice) >= currentPrice) {
      return res.status(400).json({ 
        error: `Invalid stop price for LONG position. Stop price (${stopPrice}) must be below current price (${currentPrice})` 
      });
    }
    
    if (side === 'BUY' && parseFloat(stopPrice) <= currentPrice) {
      return res.status(400).json({ 
        error: `Invalid stop price for SHORT position. Stop price (${stopPrice}) must be above current price (${currentPrice})` 
      });
    }
    
    // Ensure quantity is not greater than position size
    const positionSize = Math.abs(positionAmt);
    if (quantity > positionSize) {
      return res.status(400).json({ error: `Quantity (${quantity}) exceeds position size (${positionSize})` });
    }
    
    // Get precision for the symbol
    const precision = await getSymbolPrecision(symbol, binanceClient);
    
    console.log(`Placing stop market order: ${symbol}, Stop Price: ${stopPrice}, Quantity: ${quantity}, Precision: ${precision}`);
    
    // Place stop market order
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'STOP_MARKET',
      stopPrice: stopPrice,
      quantity: quantity.toFixed(precision),
      reduceOnly: true
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      stopPrice: stopPrice,
      quantity: order.origQty,
      message: `Stop market order placed: ${symbol}`
    });
  } catch (error) {
    console.error('Error placing stop market order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all open orders
 */
router.get('/open-orders', async (req, res) => {
  try {
    // Create Binance client
    const binanceClient = await createBinanceClient(req);
    
    // Get all open orders
    const openOrders = await binanceClient.futuresOpenOrders();
    
    // Format the response
    const formattedOrders = openOrders.map(order => ({
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      price: order.price,
      stopPrice: order.stopPrice || null,
      origQty: order.origQty,
      time: order.time,
      reduceOnly: order.reduceOnly,
      status: order.status
    }));
    
    res.json({
      success: true,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching open orders:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel an open order
 */
router.post('/cancel-order', async (req, res) => {
  try {
    const { symbol, orderId } = req.body;
    
    if (!symbol || !orderId) {
      return res.status(400).json({ error: 'Symbol and orderId are required' });
    }
    
    // Create Binance client
    const binanceClient = await createBinanceClient(req);
    
    // Cancel the order
    const result = await binanceClient.futuresCancelOrder({
      symbol: symbol,
      orderId: orderId
    });
    
    res.json({
      success: true,
      orderId: result.orderId,
      symbol: result.symbol,
      status: result.status,
      message: `Order cancelled: ${symbol} #${orderId}`
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel all open orders
 */
router.post('/cancel-all-orders', async (req, res) => {
  try {
    // Create Binance client
    const binanceClient = await createBinanceClient(req);
    
    // Get all open orders
    const openOrders = await binanceClient.futuresOpenOrders();
    
    if (openOrders.length === 0) {
      return res.json({
        success: true,
        message: 'No open orders to cancel'
      });
    }
    
    // Group orders by symbol
    const ordersBySymbol = {};
    openOrders.forEach(order => {
      if (!ordersBySymbol[order.symbol]) {
        ordersBySymbol[order.symbol] = [];
      }
      ordersBySymbol[order.symbol].push(order);
    });
    
    // Cancel all orders for each symbol
    const results = [];
    for (const symbol of Object.keys(ordersBySymbol)) {
      const result = await binanceClient.futuresCancelAllOpenOrders({
        symbol: symbol
      });
      results.push(result);
    }
    
    res.json({
      success: true,
      results: results,
      message: `All orders cancelled (${openOrders.length} orders)`
    });
  } catch (error) {
    console.error('Error cancelling all orders:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Place a stop market order at entry price
 */
router.post('/stop-entry', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    // Create Binance client
    const binanceClient = await createBinanceClient(req);
    
    // Get position information
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `No open position found for ${symbol}` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const entryPrice = parseFloat(position.entryPrice);
    const currentPrice = parseFloat(position.markPrice);
    
    // Validate stop price based on position side
    if (side === 'SELL' && entryPrice >= currentPrice) {
      return res.status(400).json({ 
        error: `Invalid stop price for LONG position. Entry price (${entryPrice}) must be below current price (${currentPrice})` 
      });
    }
    
    if (side === 'BUY' && entryPrice <= currentPrice) {
      return res.status(400).json({ 
        error: `Invalid stop price for SHORT position. Entry price (${entryPrice}) must be above current price (${currentPrice})` 
      });
    }
    
    // Get precision for the symbol
    const precision = await getSymbolPrecision(symbol, binanceClient);
    
    console.log(`Placing stop entry order: ${symbol}, Stop Price: ${entryPrice}, Quantity: ${Math.abs(positionAmt)}, Precision: ${precision}`);
    
    // Place stop market order
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'STOP_MARKET',
      stopPrice: entryPrice.toFixed(2),
      quantity: Math.abs(positionAmt).toFixed(precision),
      reduceOnly: true
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      stopPrice: entryPrice,
      quantity: order.origQty,
      message: `Stop entry order placed: ${symbol} at ${entryPrice}`
    });
  } catch (error) {
    console.error('Error placing stop entry order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Place a stop market order at 1% below/above entry price
 */
router.post('/percent-stop', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    // Create Binance client
    const binanceClient = await createBinanceClient(req);
    
    // Get position information
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `No open position found for ${symbol}` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const entryPrice = parseFloat(position.entryPrice);
    const currentPrice = parseFloat(position.markPrice);
    
    // Calculate stop price (1% below entry for LONG, 1% above entry for SHORT)
    const stopPrice = side === 'SELL' 
      ? entryPrice * 0.99  // 1% below entry for LONG
      : entryPrice * 1.01; // 1% above entry for SHORT
    
    // Validate stop price based on position side
    if (side === 'SELL' && stopPrice >= currentPrice) {
      return res.status(400).json({ 
        error: `Invalid stop price for LONG position. Stop price (${stopPrice}) must be below current price (${currentPrice})` 
      });
    }
    
    if (side === 'BUY' && stopPrice <= currentPrice) {
      return res.status(400).json({ 
        error: `Invalid stop price for SHORT position. Stop price (${stopPrice}) must be above current price (${currentPrice})` 
      });
    }
    
    // Get precision for the symbol
    const precision = await getSymbolPrecision(symbol, binanceClient);
    
    console.log(`Placing 1% stop order: ${symbol}, Stop Price: ${stopPrice}, Quantity: ${Math.abs(positionAmt)}, Precision: ${precision}`);
    
    // Place stop market order
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'STOP_MARKET',
      stopPrice: stopPrice.toFixed(2),
      quantity: Math.abs(positionAmt).toFixed(precision),
      reduceOnly: true
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      stopPrice: stopPrice,
      quantity: order.origQty,
      message: `1% stop order placed: ${symbol} at ${stopPrice.toFixed(2)}`
    });
  } catch (error) {
    console.error('Error placing 1% stop order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Place a stop market order at 2% below/above entry price
 */
router.post('/percent-two-stop', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    // Create Binance client
    const binanceClient = await createBinanceClient(req);
    
    // Get position information
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `No open position found for ${symbol}` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const entryPrice = parseFloat(position.entryPrice);
    const currentPrice = parseFloat(position.markPrice);
    
    // Calculate stop price (2% below entry for LONG, 2% above entry for SHORT)
    const stopPrice = side === 'SELL' 
      ? entryPrice * 0.98  // 2% below entry for LONG
      : entryPrice * 1.02; // 2% above entry for SHORT
    
    // Validate stop price based on position side
    if (side === 'SELL' && stopPrice >= currentPrice) {
      return res.status(400).json({ 
        error: `Invalid stop price for LONG position. Stop price (${stopPrice}) must be below current price (${currentPrice})` 
      });
    }
    
    if (side === 'BUY' && stopPrice <= currentPrice) {
      return res.status(400).json({ 
        error: `Invalid stop price for SHORT position. Stop price (${stopPrice}) must be above current price (${currentPrice})` 
      });
    }
    
    // Get precision for the symbol
    const precision = await getSymbolPrecision(symbol, binanceClient);
    
    console.log(`Placing 2% stop order: ${symbol}, Stop Price: ${stopPrice}, Quantity: ${Math.abs(positionAmt)}, Precision: ${precision}`);
    
    // Place stop market order
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'STOP_MARKET',
      stopPrice: stopPrice.toFixed(2),
      quantity: Math.abs(positionAmt).toFixed(precision),
      reduceOnly: true
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      stopPrice: stopPrice,
      quantity: order.origQty,
      message: `2% stop order placed: ${symbol} at ${stopPrice.toFixed(2)}`
    });
  } catch (error) {
    console.error('Error placing 2% stop order:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 