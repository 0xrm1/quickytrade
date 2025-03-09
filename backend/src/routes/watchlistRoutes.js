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

// Get all symbols
router.get('/symbols', async (req, res) => {
  try {
    const binanceClient = await createBinanceClient(req);
    
    const exchangeInfo = await binanceClient.futuresExchangeInfo();
    const symbols = exchangeInfo.symbols
      .filter(s => s.status === 'TRADING')
      .map(s => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
      }));
    
    res.json(symbols);
  } catch (error) {
    console.error('Error getting symbol list:', error);
    res.status(500).json({ error: error.message });
  }
});

// Temporary array to store watchlist (database integration will be added later)
let watchlists = {};

// Add symbol to watchlist
router.post('/add', (req, res) => {
  const { symbol, listId = 1 } = req.body;
  const userId = req.user.id;
  
  // Initialize user's watchlist if it doesn't exist
  if (!watchlists[userId]) {
    watchlists[userId] = [];
  }
  
  // Check if symbol already exists in the watchlist
  const symbolExists = watchlists[userId].find(item => item.symbol === symbol && item.listId === listId);
  
  if (symbolExists) {
    return res.status(400).json({ error: 'Symbol already exists in watchlist' });
  }
  
  // Add symbol to watchlist
  watchlists[userId].push({
    symbol,
    listId,
    addedAt: new Date().toISOString()
  });
  
  res.status(201).json({ message: 'Symbol added successfully', symbol, listId });
});

// Remove symbol from watchlist
router.delete('/remove/:symbol', (req, res) => {
  const { symbol } = req.params;
  const { listId = 1 } = req.query;
  const userId = req.user.id;
  
  // Check if user has a watchlist
  if (!watchlists[userId]) {
    return res.status(404).json({ error: 'Watchlist not found' });
  }
  
  // Check if symbol exists in the watchlist
  const symbolIndex = watchlists[userId].findIndex(item => item.symbol === symbol && item.listId == listId);
  
  if (symbolIndex === -1) {
    return res.status(404).json({ error: 'Symbol not found in watchlist' });
  }
  
  // Remove symbol from watchlist
  watchlists[userId].splice(symbolIndex, 1);
  
  res.json({ message: 'Symbol removed successfully', symbol, listId });
});

// Get watchlist
router.get('/', (req, res) => {
  const { listId } = req.query;
  const userId = req.user.id;
  
  // Check if user has a watchlist
  if (!watchlists[userId]) {
    watchlists[userId] = [];
  }
  
  if (listId) {
    // Get specific list
    const filteredList = watchlists[userId].filter(item => item.listId == listId);
    res.json({ watchlist: filteredList });
  } else {
    // Get all lists
    res.json({ watchlist: watchlists[userId] });
  }
});

// Sync watchlist (save data from localStorage)
router.post('/sync', (req, res) => {
  const { watchlist: newWatchlist } = req.body;
  const userId = req.user.id;
  
  if (Array.isArray(newWatchlist)) {
    watchlists[userId] = newWatchlist;
    res.json({ success: true, message: 'Watchlist synchronized successfully' });
  } else {
    res.status(400).json({ error: 'Invalid watchlist format' });
  }
});

// Get ticker information for a symbol
router.get('/ticker/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const binanceClient = await createBinanceClient(req);
    
    const ticker = await binanceClient.futuresDailyStats({ symbol });
    res.json(ticker);
  } catch (error) {
    console.error('Error getting ticker information:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 