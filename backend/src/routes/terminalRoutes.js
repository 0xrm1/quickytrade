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

// Terminal command history (user-specific)
const commandHistory = {};

/**
 * Add command to history
 * @param {number} userId - User ID
 * @param {string} command - Command text
 * @param {Object} result - Command result
 */
function addToHistory(userId, command, result = null) {
  // Initialize user's history if it doesn't exist
  if (!commandHistory[userId]) {
    commandHistory[userId] = [];
  }
  
  // Add to history (keep most recent commands at the beginning)
  commandHistory[userId].unshift({
    command,
    result,
    timestamp: Date.now()
  });
  
  // Limit history to 100 commands
  if (commandHistory[userId].length > 100) {
    commandHistory[userId] = commandHistory[userId].slice(0, 100);
  }
}

// Execute terminal command
router.post('/execute', async (req, res) => {
  try {
    const { command } = req.body;
    const userId = req.user.id;
    
    if (!command) {
      return res.status(400).json({ error: 'Command not specified' });
    }
    
    // Add command to history
    addToHistory(userId, command);
    
    // Parse command
    const parts = command.trim().split(' ');
    const action = parts[0].toLowerCase();
    
    // Create Binance client with user's API keys
    let binanceClient;
    try {
      binanceClient = await createBinanceClient(req);
    } catch (error) {
      return res.status(403).json({ 
        error: 'API keys not configured. Please add your Binance API keys in settings.',
        success: false
      });
    }
    
    // Process shorthand commands (l and s)
    if (action === 'l' || action === 's') {
      if (parts.length < 3) {
        return res.status(400).json({ 
          error: 'Invalid command. Usage: l/s SYMBOL AMOUNT [leverage VALUE]',
          success: false
        });
      }
      
      // Get symbol and add USDT if missing
      let symbol = parts[1].toUpperCase();
      if (!symbol.endsWith('USDT')) {
        symbol += 'USDT';
      }
      
      const amount = parseFloat(parts[2]);
      
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ 
          error: 'Invalid amount. Enter a positive number.',
          success: false
        });
      }
      
      // Check for leverage parameter
      let leverage = 10; // Default value
      if (parts.length >= 5 && parts[3].toLowerCase() === 'leverage') {
        leverage = parseInt(parts[4]);
      }
      
      console.log(`Processing shorthand command: ${command} -> ${action === 'l' ? 'LONG' : 'SHORT'} ${symbol} ${amount} (${leverage}x)`);
      
      // Set leverage
      await binanceClient.futuresLeverage({
        symbol: symbol,
        leverage: leverage
      });
      
      // Get symbol price
      const ticker = await binanceClient.futuresDailyStats({ symbol });
      const currentPrice = parseFloat(ticker.lastPrice);
      
      // Get precision for the symbol
      const precision = await getSymbolPrecision(symbol, binanceClient);
      
      // Calculate quantity
      const quantity = amount / currentPrice;
      
      // Round to correct precision (to comply with LOT_SIZE filter)
      const exchangeInfo = await binanceClient.futuresExchangeInfo();
      const symbolInfo = exchangeInfo.symbols.find(s => s.symbol === symbol);
      const lotSizeFilter = symbolInfo.filters.find(filter => filter.filterType === 'LOT_SIZE');
      const stepSize = parseFloat(lotSizeFilter.stepSize);
      const quantityPrecise = Math.floor(quantity / stepSize) * stepSize;
      
      console.log(`Opening position: ${symbol}, ${amount} USDT, Quantity: ${quantityPrecise}, Precision: ${precision}, Step Size: ${stepSize}`);
      
      // Send market order
      const order = await binanceClient.futuresOrder({
        symbol: symbol,
        side: action === 'l' ? 'BUY' : 'SELL',
        type: 'MARKET',
        quantity: quantityPrecise.toFixed(precision),
      });
      
      return res.json({
        success: true,
        command: command,
        result: {
          orderId: order.orderId,
          symbol: order.symbol,
          side: order.side,
          price: order.price,
          quantity: order.origQty
        },
        message: `${action === 'l' ? 'LONG' : 'SHORT'} position opened: ${symbol}, ${amount} USDT, ${leverage}x`
      });
    }
    else if (action === 'close') {
      // Close position
      if (parts.length < 2) {
        return res.status(400).json({ 
          error: 'Invalid command. Usage: close SYMBOL',
          success: false
        });
      }
      
      const symbol = parts[1].toUpperCase();
      
      // Get position information
      const positions = await binanceClient.futuresPositionRisk({ symbol });
      
      if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
        return res.status(404).json({ 
          error: `No open position found for ${symbol}`,
          success: false
        });
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
      
      return res.json({
        success: true,
        command: command,
        result: {
          orderId: order.orderId,
          symbol: order.symbol,
          side: order.side,
          price: order.price,
          quantity: order.origQty
        },
        message: `Position closed: ${symbol}`
      });
    }
    else if (action === 'positions') {
      // List all positions
      const allPositions = await binanceClient.futuresPositionRisk();
      const activePositions = allPositions.filter(p => parseFloat(p.positionAmt) !== 0);
      
      if (activePositions.length === 0) {
        return res.json({
          success: true,
          command: command,
          positions: [],
          message: 'No open positions found'
        });
      }
      
      // Format positions
      const formattedPositions = activePositions.map(pos => {
        const posAmt = parseFloat(pos.positionAmt);
        const isLong = posAmt > 0;
        const pnl = parseFloat(pos.unRealizedProfit);
        
        return {
          symbol: pos.symbol,
          side: isLong ? 'LONG' : 'SHORT',
          size: Math.abs(posAmt).toFixed(3),
          entryPrice: parseFloat(pos.entryPrice).toFixed(2),
          markPrice: parseFloat(pos.markPrice).toFixed(2),
          pnl: `${pnl > 0 ? '+' : ''}${pnl.toFixed(2)} USDT`,
          liqPrice: parseFloat(pos.liquidationPrice).toFixed(2)
        };
      });
      
      return res.json({
        success: true,
        command: command,
        positions: formattedPositions,
        message: `Found ${formattedPositions.length} open positions`
      });
    }
    else if (action === 'price') {
      // Show symbol price
      if (parts.length < 2) {
        return res.status(400).json({ 
          error: 'Invalid command. Usage: price SYMBOL',
          success: false
        });
      }
      
      let symbol = parts[1].toUpperCase();
      if (!symbol.endsWith('USDT')) {
        symbol += 'USDT';
      }
      
      try {
        // Get price information
        const ticker = await binanceClient.futuresDailyStats({ symbol });
        const price = parseFloat(ticker.lastPrice);
        const priceChange = parseFloat(ticker.priceChangePercent);
        
        return res.json({
          success: true,
          command: command,
          price: {
            symbol: symbol,
            price: price.toFixed(4),
            change: `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`,
            high: parseFloat(ticker.highPrice).toFixed(4),
            low: parseFloat(ticker.lowPrice).toFixed(4)
          },
          message: `${symbol}: ${price.toFixed(4)} (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%)`
        });
      } catch (error) {
        return res.status(404).json({ 
          error: `Symbol not found: ${symbol}`,
          success: false
        });
      }
    }
    else if (action === 'help') {
      // Command help
      return res.json({
        success: true,
        command: command,
        help: {
          l: 'Quick long position: l SYMBOL AMOUNT [leverage LEVERAGE]',
          s: 'Quick short position: s SYMBOL AMOUNT [leverage LEVERAGE]',
          close: 'Close position: close SYMBOL',
          positions: 'List open positions: positions',
          price: 'Show symbol price: price SYMBOL',
          balance: 'Account balance: balance',
          help: 'Command help: help'
        },
        message: `Available commands:
- l SYMBOL AMOUNT [leverage LEVERAGE] - Quick long position (USDT added automatically)
- s SYMBOL AMOUNT [leverage LEVERAGE] - Quick short position (USDT added automatically)
- close SYMBOL - Close a specific position
- positions - List all open positions
- price SYMBOL - Show current price for symbol
- balance - Show account balance
- help - Show available commands`
      });
    }
    else if (action === 'balance') {
      // Account balance
      const account = await binanceClient.futuresAccountBalance();
      const usdt = account.find(a => a.asset === 'USDT');
      
      return res.json({
        success: true,
        command: command,
        balance: {
          asset: usdt.asset,
          balance: usdt.balance,
          availableBalance: usdt.availableBalance
        },
        message: `Balance: ${usdt.availableBalance} USDT`
      });
    }
    else {
      return res.status(400).json({ 
        error: 'Unknown command. Type "help" for available commands.',
        success: false,
        command: command
      });
    }
  } catch (error) {
    console.error('Terminal command error:', error);
    res.status(500).json({ 
      error: error.message,
      success: false,
      command: req.body.command
    });
  }
});

// Get command history
router.get('/history', (req, res) => {
  const userId = req.user.id;
  
  // Initialize user's history if it doesn't exist
  if (!commandHistory[userId]) {
    commandHistory[userId] = [];
  }
  
  res.json(commandHistory[userId]);
});

// Add to command history (API endpoint)
router.post('/history', (req, res) => {
  const { command, result } = req.body;
  const userId = req.user.id;
  
  if (!command) {
    return res.status(400).json({ error: 'Command not specified' });
  }
  
  addToHistory(userId, command, result);
  
  res.json({ success: true });
});

module.exports = router; 