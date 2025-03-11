const express = require('express');
const WebSocket = require('ws');
const { createConnection, subscribeClient, unsubscribeClient, getConnections } = require('../utils/websocketManager');
const { checkApiKey, checkRateLimit } = require('../middleware/authMiddleware');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// WebSocket server
let wss;

/**
 * Initialize WebSocket server
 */
const initWebSocketServer = (server) => {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    logger.info('Client connected to WebSocket server');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        // Handle subscribe message
        if (data.method === 'SUBSCRIBE') {
          const streams = Array.isArray(data.params) ? data.params : [data.params];
          
          if (streams.length === 0) {
            ws.send(JSON.stringify({
              id: data.id,
              status: 'error',
              message: 'No streams specified'
            }));
            return;
          }
          
          const success = subscribeClient(ws, streams);
          
          ws.send(JSON.stringify({
            id: data.id,
            status: success ? 'success' : 'error',
            message: success ? 'Subscribed to streams' : 'Failed to subscribe to streams'
          }));
        }
        
        // Handle unsubscribe message
        if (data.method === 'UNSUBSCRIBE') {
          const streams = Array.isArray(data.params) ? data.params : [data.params];
          
          const success = unsubscribeClient(ws, streams);
          
          ws.send(JSON.stringify({
            id: data.id,
            status: success ? 'success' : 'error',
            message: success ? 'Unsubscribed from streams' : 'Failed to unsubscribe from streams'
          }));
        }
      } catch (error) {
        logger.error(`WebSocket message error: ${error.message}`);
        ws.send(JSON.stringify({
          status: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
      logger.info('Client disconnected from WebSocket server');
      unsubscribeClient(ws);
    });
    
    ws.on('error', (error) => {
      logger.error(`WebSocket client error: ${error.message}`);
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      status: 'success',
      message: 'Connected to QuickyTrade WebSocket server',
      timestamp: Date.now()
    }));
  });
  
  return wss;
};

/**
 * @route GET /api/binance/ws/status
 * @desc Get WebSocket server status
 * @access Public
 */
router.get('/status', checkRateLimit, (req, res) => {
  const connections = getConnections();
  
  res.status(200).json({
    status: 'success',
    data: {
      clients: wss ? wss.clients.size : 0,
      connections: connections.connections,
      subscriptions: connections.subscriptions
    }
  });
});

/**
 * @route POST /api/binance/ws/subscribe
 * @desc Subscribe to streams
 * @access Public
 */
router.post('/subscribe', checkRateLimit, (req, res, next) => {
  try {
    const { streams } = req.body;
    
    if (!streams || !Array.isArray(streams) || streams.length === 0) {
      return next(new ApiError(400, 'Streams must be a non-empty array'));
    }
    
    // Create connections for each stream
    streams.forEach(stream => {
      createConnection([stream]);
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Subscribed to streams',
      data: {
        streams
      }
    });
  } catch (error) {
    logger.error(`Subscribe error: ${error.message}`);
    return next(new ApiError(500, 'Error subscribing to streams'));
  }
});

/**
 * @route POST /api/binance/ws/unsubscribe
 * @desc Unsubscribe from streams
 * @access Public
 */
router.post('/unsubscribe', checkRateLimit, (req, res, next) => {
  try {
    const { streams } = req.body;
    
    if (!streams || !Array.isArray(streams) || streams.length === 0) {
      return next(new ApiError(400, 'Streams must be a non-empty array'));
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Unsubscribed from streams',
      data: {
        streams
      }
    });
  } catch (error) {
    logger.error(`Unsubscribe error: ${error.message}`);
    return next(new ApiError(500, 'Error unsubscribing from streams'));
  }
});

module.exports = {
  router,
  initWebSocketServer
}; 