const WebSocket = require('ws');
const logger = require('./logger');
const { setCache } = require('../config/redis');

// WebSocket connections
const connections = new Map();

// Subscription map to track which clients are subscribed to which streams
const subscriptions = new Map();

// Last message cache to implement threshold-based updates
const lastMessages = new Map();

/**
 * Create WebSocket connection to Binance
 */
const createConnection = (streams = []) => {
  try {
    // Create a unique key for this connection
    const key = streams.sort().join(',');
    
    // Check if connection already exists
    if (connections.has(key)) {
      return connections.get(key);
    }
    
    // Create WebSocket URL
    const baseUrl = 'wss://stream.binance.com:9443/ws';
    const url = streams.length > 0 ? `${baseUrl}/${streams.join('/')}` : baseUrl;
    
    // Create WebSocket connection
    const ws = new WebSocket(url);
    
    // Set up event handlers
    ws.on('open', () => {
      logger.info(`WebSocket connection opened for streams: ${streams.join(', ')}`);
      
      // If no streams specified in URL, subscribe to them now
      if (streams.length === 0 && ws.readyState === WebSocket.OPEN) {
        const subscribeMessage = JSON.stringify({
          method: 'SUBSCRIBE',
          params: streams,
          id: Date.now()
        });
        ws.send(subscribeMessage);
      }
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        // Process the message
        processMessage(message);
        
        // Cache the message
        if (message.stream) {
          lastMessages.set(message.stream, message);
          
          // Also cache in Redis for other services to use
          setCache(`ws:${message.stream}`, message, 60);
        }
      } catch (error) {
        logger.error(`WebSocket message parsing error: ${error.message}`);
      }
    });
    
    ws.on('error', (error) => {
      logger.error(`WebSocket error: ${error.message}`);
    });
    
    ws.on('close', () => {
      logger.info(`WebSocket connection closed for streams: ${streams.join(', ')}`);
      
      // Remove from connections map
      connections.delete(key);
      
      // Reconnect after a delay
      setTimeout(() => {
        logger.info(`Reconnecting WebSocket for streams: ${streams.join(', ')}`);
        createConnection(streams);
      }, 5000);
    });
    
    // Store the connection
    connections.set(key, ws);
    
    return ws;
  } catch (error) {
    logger.error(`WebSocket connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Process WebSocket message
 */
const processMessage = (message) => {
  // Check if it's a ticker message
  if (message.e === '24hrTicker' || (message.data && message.data.e === '24hrTicker')) {
    processTicker(message);
  }
  
  // Check if it's a kline message
  if (message.e === 'kline' || (message.data && message.data.e === 'kline')) {
    processKline(message);
  }
  
  // Check if it's a depth message
  if (message.e === 'depthUpdate' || (message.data && message.data.e === 'depthUpdate')) {
    processDepth(message);
  }
  
  // Check if it's a trade message
  if (message.e === 'trade' || (message.data && message.data.e === 'trade')) {
    processTrade(message);
  }
};

/**
 * Process ticker message with threshold-based updates
 */
const processTicker = (message) => {
  try {
    const data = message.data || message;
    const symbol = data.s;
    const stream = `${symbol.toLowerCase()}@ticker`;
    
    // Get last message for this stream
    const lastMessage = lastMessages.get(stream);
    
    if (lastMessage) {
      const lastData = lastMessage.data || lastMessage;
      
      // Calculate price change percentage
      const lastPrice = parseFloat(lastData.c);
      const currentPrice = parseFloat(data.c);
      const priceChangePercent = Math.abs((currentPrice - lastPrice) / lastPrice * 100);
      
      // Calculate volume change percentage
      const lastVolume = parseFloat(lastData.v);
      const currentVolume = parseFloat(data.v);
      const volumeChangePercent = Math.abs((currentVolume - lastVolume) / lastVolume * 100);
      
      // Only update if changes exceed thresholds
      const priceThreshold = parseFloat(process.env.PRICE_CHANGE_THRESHOLD || '0.1');
      const volumeThreshold = parseFloat(process.env.VOLUME_CHANGE_THRESHOLD || '1.0');
      
      if (priceChangePercent < priceThreshold && volumeChangePercent < volumeThreshold) {
        // Changes are below thresholds, don't update
        return;
      }
    }
    
    // Broadcast the message to all clients subscribed to this stream
    broadcastToSubscribers(stream, message);
  } catch (error) {
    logger.error(`Process ticker error: ${error.message}`);
  }
};

/**
 * Process kline message with threshold-based updates
 */
const processKline = (message) => {
  try {
    const data = message.data || message;
    const symbol = data.s;
    const interval = data.k.i;
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    
    // Get last message for this stream
    const lastMessage = lastMessages.get(stream);
    
    if (lastMessage) {
      const lastData = lastMessage.data || lastMessage;
      const lastKline = lastData.k;
      const currentKline = data.k;
      
      // Only update if close price has changed
      if (lastKline.c === currentKline.c) {
        return;
      }
      
      // Calculate price change percentage
      const lastClose = parseFloat(lastKline.c);
      const currentClose = parseFloat(currentKline.c);
      const priceChangePercent = Math.abs((currentClose - lastClose) / lastClose * 100);
      
      // Only update if changes exceed thresholds
      const priceThreshold = parseFloat(process.env.PRICE_CHANGE_THRESHOLD || '0.1');
      
      if (priceChangePercent < priceThreshold) {
        // Changes are below thresholds, don't update
        return;
      }
    }
    
    // Broadcast the message to all clients subscribed to this stream
    broadcastToSubscribers(stream, message);
  } catch (error) {
    logger.error(`Process kline error: ${error.message}`);
  }
};

/**
 * Process depth message
 */
const processDepth = (message) => {
  // For depth updates, we don't apply thresholds as they are already filtered by Binance
  const data = message.data || message;
  const symbol = data.s;
  const stream = `${symbol.toLowerCase()}@depth`;
  
  // Broadcast the message to all clients subscribed to this stream
  broadcastToSubscribers(stream, message);
};

/**
 * Process trade message
 */
const processTrade = (message) => {
  // For trade updates, we don't apply thresholds as each trade is important
  const data = message.data || message;
  const symbol = data.s;
  const stream = `${symbol.toLowerCase()}@trade`;
  
  // Broadcast the message to all clients subscribed to this stream
  broadcastToSubscribers(stream, message);
};

/**
 * Broadcast message to all subscribers
 */
const broadcastToSubscribers = (stream, message) => {
  try {
    // Get all clients subscribed to this stream
    const clients = subscriptions.get(stream) || [];
    
    // Broadcast to each client
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  } catch (error) {
    logger.error(`Broadcast error: ${error.message}`);
  }
};

/**
 * Subscribe a client to streams
 */
const subscribeClient = (client, streams) => {
  try {
    streams.forEach(stream => {
      // Get current subscribers for this stream
      const clients = subscriptions.get(stream) || [];
      
      // Add this client if not already subscribed
      if (!clients.includes(client)) {
        clients.push(client);
        subscriptions.set(stream, clients);
      }
      
      // Ensure we have a connection to Binance for this stream
      if (!connections.has(stream)) {
        createConnection([stream]);
      }
      
      // Send the last message for this stream if available
      const lastMessage = lastMessages.get(stream);
      if (lastMessage && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(lastMessage));
      }
    });
    
    return true;
  } catch (error) {
    logger.error(`Subscribe client error: ${error.message}`);
    return false;
  }
};

/**
 * Unsubscribe a client from streams
 */
const unsubscribeClient = (client, streams) => {
  try {
    // If no streams specified, unsubscribe from all
    const streamsToUnsubscribe = streams || Array.from(subscriptions.keys());
    
    streamsToUnsubscribe.forEach(stream => {
      // Get current subscribers for this stream
      const clients = subscriptions.get(stream) || [];
      
      // Remove this client
      const index = clients.indexOf(client);
      if (index !== -1) {
        clients.splice(index, 1);
        
        // Update subscriptions map
        if (clients.length === 0) {
          subscriptions.delete(stream);
        } else {
          subscriptions.set(stream, clients);
        }
      }
    });
    
    return true;
  } catch (error) {
    logger.error(`Unsubscribe client error: ${error.message}`);
    return false;
  }
};

/**
 * Get all active connections
 */
const getConnections = () => {
  return {
    connections: Array.from(connections.keys()),
    subscriptions: Array.from(subscriptions.entries()).map(([stream, clients]) => ({
      stream,
      clients: clients.length
    }))
  };
};

module.exports = {
  createConnection,
  subscribeClient,
  unsubscribeClient,
  getConnections
}; 