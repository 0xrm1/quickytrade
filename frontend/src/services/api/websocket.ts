/**
 * WebSocket bağlantıları
 */

// Create WebSocket connection
export const createWebSocketConnection = () => {
  try {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws');
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      
      // Subscribe to some default streams
      const subscribeMessage = JSON.stringify({
        method: 'SUBSCRIBE',
        params: [
          'btcusdt@ticker',
          'ethusdt@ticker',
        ],
        id: 1
      });
      
      ws.send(subscribeMessage);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return ws;
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
    return null;
  }
}; 