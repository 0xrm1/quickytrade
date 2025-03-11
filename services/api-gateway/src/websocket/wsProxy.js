const WebSocket = require('ws');
const logger = require('../utils/logger');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Setup WebSocket proxy
 * @param {WebSocket.Server} wss - WebSocket server
 * @param {Object} redisClient - Redis client
 */
function setupWebSocketProxy(wss, redisClient) {
  // Store connected clients
  const clients = new Map();
  
  // Store subscriptions
  const subscriptions = new Map();
  
  // Connect to Binance API WebSocket
  const binanceWs = new WebSocket(`${process.env.BINANCE_API_SERVICE_URL.replace('http', 'ws')}/ws`);
  
  // Handle Binance WebSocket connection
  binanceWs.on('open', () => {
    logger.info('Connected to Binance API WebSocket');
  });
  
  // Handle Binance WebSocket messages
  binanceWs.on('message', (data) => {
    const message = JSON.parse(data);
    
    // If it's a subscription confirmation
    if (message.result === null && message.id) {
      logger.debug(`Subscription confirmed for ID: ${message.id}`);
      return;
    }
    
    // If it's a stream message
    if (message.stream) {
      // Find clients subscribed to this stream
      const streamSubscribers = Array.from(subscriptions.entries())
        .filter(([_, streams]) => streams.includes(message.stream))
        .map(([clientId, _]) => clientId);
      
      // Send message to subscribed clients
      streamSubscribers.forEach(clientId => {
        const client = clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  });
  
  // Handle Binance WebSocket errors
  binanceWs.on('error', (error) => {
    logger.error('Binance WebSocket error:', error.message);
  });
  
  // Handle Binance WebSocket close
  binanceWs.on('close', () => {
    logger.warn('Binance WebSocket connection closed. Reconnecting...');
    setTimeout(() => {
      setupWebSocketProxy(wss, redisClient);
    }, 5000);
  });
  
  // Handle client connections
  wss.on('connection', (ws, req) => {
    // Generate client ID
    const clientId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Store client
    clients.set(clientId, ws);
    
    // Initialize empty subscriptions for this client
    subscriptions.set(clientId, []);
    
    logger.info(`Client connected: ${clientId}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to QuickyTrade WebSocket server',
      clientId
    }));
    
    // Handle client messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === 'auth') {
          const user = verifyToken(data.token);
          if (user) {
            ws.user = user;
            ws.send(JSON.stringify({
              type: 'auth',
              success: true,
              message: 'Authentication successful'
            }));
            
            // Cache user data in Redis
            await redisClient.set(`ws:user:${clientId}`, JSON.stringify(user), { EX: 3600 });
            
            logger.info(`Client authenticated: ${clientId}`);
          } else {
            ws.send(JSON.stringify({
              type: 'auth',
              success: false,
              message: 'Authentication failed'
            }));
          }
          return;
        }
        
        // Handle subscription
        if (data.method === 'SUBSCRIBE') {
          // Get current subscriptions for this client
          const clientSubscriptions = subscriptions.get(clientId) || [];
          
          // Add new subscriptions
          const newSubscriptions = data.params.filter(stream => !clientSubscriptions.includes(stream));
          
          if (newSubscriptions.length > 0) {
            // Update client subscriptions
            subscriptions.set(clientId, [...clientSubscriptions, ...newSubscriptions]);
            
            // Forward subscription to Binance WebSocket
            binanceWs.send(JSON.stringify({
              method: 'SUBSCRIBE',
              params: newSubscriptions,
              id: data.id
            }));
            
            logger.info(`Client ${clientId} subscribed to: ${newSubscriptions.join(', ')}`);
            
            // Confirm subscription to client
            ws.send(JSON.stringify({
              type: 'subscription',
              success: true,
              message: `Subscribed to: ${newSubscriptions.join(', ')}`,
              subscriptions: subscriptions.get(clientId)
            }));
          } else {
            // Already subscribed
            ws.send(JSON.stringify({
              type: 'subscription',
              success: true,
              message: 'Already subscribed to all requested streams',
              subscriptions: clientSubscriptions
            }));
          }
          return;
        }
        
        // Handle unsubscription
        if (data.method === 'UNSUBSCRIBE') {
          // Get current subscriptions for this client
          const clientSubscriptions = subscriptions.get(clientId) || [];
          
          // Find streams to unsubscribe
          const streamsToRemove = data.params.filter(stream => clientSubscriptions.includes(stream));
          
          if (streamsToRemove.length > 0) {
            // Update client subscriptions
            subscriptions.set(
              clientId,
              clientSubscriptions.filter(stream => !streamsToRemove.includes(stream))
            );
            
            // Check if any other clients are subscribed to these streams
            const otherClientsSubscribed = Array.from(subscriptions.entries())
              .filter(([id, _]) => id !== clientId)
              .some(([_, streams]) => 
                streamsToRemove.some(stream => streams.includes(stream))
              );
            
            // If no other clients are subscribed, unsubscribe from Binance
            if (!otherClientsSubscribed) {
              binanceWs.send(JSON.stringify({
                method: 'UNSUBSCRIBE',
                params: streamsToRemove,
                id: data.id
              }));
            }
            
            logger.info(`Client ${clientId} unsubscribed from: ${streamsToRemove.join(', ')}`);
            
            // Confirm unsubscription to client
            ws.send(JSON.stringify({
              type: 'unsubscription',
              success: true,
              message: `Unsubscribed from: ${streamsToRemove.join(', ')}`,
              subscriptions: subscriptions.get(clientId)
            }));
          } else {
            // Not subscribed to these streams
            ws.send(JSON.stringify({
              type: 'unsubscription',
              success: false,
              message: 'Not subscribed to any of the requested streams',
              subscriptions: clientSubscriptions
            }));
          }
          return;
        }
        
        // Handle unknown messages
        logger.warn(`Unknown message type from client ${clientId}:`, data);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
      } catch (error) {
        logger.error(`Error processing message from client ${clientId}:`, error.message);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error processing message'
        }));
      }
    });
    
    // Handle client disconnect
    ws.on('close', async () => {
      logger.info(`Client disconnected: ${clientId}`);
      
      // Get client subscriptions
      const clientSubscriptions = subscriptions.get(clientId) || [];
      
      // Check if any other clients are subscribed to these streams
      if (clientSubscriptions.length > 0) {
        const streamsToUnsubscribe = [];
        
        clientSubscriptions.forEach(stream => {
          const otherClientsSubscribed = Array.from(subscriptions.entries())
            .filter(([id, _]) => id !== clientId)
            .some(([_, streams]) => streams.includes(stream));
          
          if (!otherClientsSubscribed) {
            streamsToUnsubscribe.push(stream);
          }
        });
        
        // Unsubscribe from streams that no other clients are using
        if (streamsToUnsubscribe.length > 0) {
          binanceWs.send(JSON.stringify({
            method: 'UNSUBSCRIBE',
            params: streamsToUnsubscribe,
            id: Date.now()
          }));
          
          logger.info(`Unsubscribed from unused streams: ${streamsToUnsubscribe.join(', ')}`);
        }
      }
      
      // Remove client data
      clients.delete(clientId);
      subscriptions.delete(clientId);
      
      // Remove user data from Redis
      await redisClient.del(`ws:user:${clientId}`);
    });
  });
  
  // Periodically check client connections
  setInterval(() => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    });
  }, 30000);
  
  // Log WebSocket server status
  setInterval(() => {
    logger.info(`WebSocket server status: ${wss.clients.size} clients connected`);
  }, 60000);
  
  return {
    getClients: () => clients,
    getSubscriptions: () => subscriptions
  };
}

module.exports = setupWebSocketProxy; 