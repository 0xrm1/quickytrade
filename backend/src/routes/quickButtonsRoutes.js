const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// User-specific quick buttons storage (temporary in-memory storage)
// In a production environment, this should be stored in a database
const userQuickButtons = {};

/**
 * Get all quick buttons for the current user
 * @route GET /api/quick-buttons
 * @access Private
 */
router.get('/', (req, res) => {
  const userId = req.user.id;
  
  // Initialize user's quick buttons if they don't exist
  if (!userQuickButtons[userId]) {
    userQuickButtons[userId] = [];
  }
  
  res.json(userQuickButtons[userId]);
});

/**
 * Add a new quick button
 * @route POST /api/quick-buttons/add
 * @access Private
 */
router.post('/add', (req, res) => {
  const { symbol, amount, side } = req.body;
  const userId = req.user.id;
  
  // Validate required fields
  if (!symbol || !amount || !side) {
    return res.status(400).json({ 
      error: 'Symbol, amount, and side are required fields'
    });
  }
  
  // Format symbol to uppercase
  const formattedSymbol = symbol.toUpperCase();
  
  // Create new button
  const newButton = {
    id: Date.now().toString(), // Simple ID generation
    symbol: formattedSymbol,
    amount: parseFloat(amount),
    side: side.toLowerCase(), // 'long' or 'short'
    createdAt: new Date().toISOString()
  };
  
  // Initialize user's quick buttons if they don't exist
  if (!userQuickButtons[userId]) {
    userQuickButtons[userId] = [];
  }
  
  // Add button to user's list
  userQuickButtons[userId].push(newButton);
  
  res.status(201).json({ 
    message: 'Quick button added successfully', 
    button: newButton 
  });
});

/**
 * Remove a quick button
 * @route DELETE /api/quick-buttons/remove/:id
 * @access Private
 */
router.delete('/remove/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Check if user has quick buttons
  if (!userQuickButtons[userId]) {
    return res.status(404).json({ error: 'No quick buttons found for this user' });
  }
  
  // Find button index
  const buttonIndex = userQuickButtons[userId].findIndex(button => button.id === id);
  
  if (buttonIndex === -1) {
    return res.status(404).json({ error: 'Button not found' });
  }
  
  // Remove button from list
  const removedButton = userQuickButtons[userId].splice(buttonIndex, 1)[0];
  
  res.json({ 
    message: 'Button removed successfully', 
    button: removedButton 
  });
});

/**
 * Sync quick buttons (save data from localStorage)
 * @route POST /api/quick-buttons/sync
 * @access Private
 */
router.post('/sync', (req, res) => {
  const { quickButtons } = req.body;
  const userId = req.user.id;
  
  if (!Array.isArray(quickButtons)) {
    return res.status(400).json({ error: 'Invalid button format' });
  }
  
  // Save buttons for this user
  userQuickButtons[userId] = quickButtons;
  
  res.json({ 
    success: true, 
    message: 'Quick buttons synchronized successfully' 
  });
});

module.exports = router; 