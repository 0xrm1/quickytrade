import api from './config';

/**
 * Terminal API servisi
 */
const terminalAPI = {
  // Execute command
  executeCommand: (command: string) => {
    return api.post('/terminal/execute', { command })
      .then(response => response.data);
  },
  
  // Get command history
  getCommandHistory: () => {
    return api.get('/terminal/history')
      .then(response => response.data);
  },
  
  // Get server IP address
  getServerIp: () => {
    return api.get('/terminal/server-ip')
      .then(response => response.data);
  },
  
  // Get market data
  getMarketData: (symbol: string) => {
    return api.get(`/market-data/${symbol}`)
      .then(response => response.data);
  },
  
  // Place order
  placeOrder: (orderData: any) => {
    return api.post('/orders', orderData)
      .then(response => response.data);
  },
  
  // Get orders
  getOrders: () => {
    return api.get('/orders')
      .then(response => response.data);
  }
};

export default terminalAPI; 