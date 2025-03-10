import api from './config';

/**
 * Pozisyonlar API servisi
 */
const positionsAPI = {
  // Get all positions
  getPositions: () => {
    return api.get('/positions')
      .then(response => response.data);
  },
  
  // Close a position
  closePosition: (symbol: string) => {
    return api.post('/positions/close', { symbol })
      .then(response => response.data);
  },
  
  // Close a partial position
  closePartialPosition: (symbol: string, quantity: number) => {
    return api.post('/positions/close-partial', { symbol, quantity })
      .then(response => response.data);
  },
  
  // Place a limit order to close a position
  limitClosePosition: (symbol: string, price: number, quantity: number) => {
    return api.post('/positions/limit-close', { symbol, price, quantity })
      .then(response => response.data);
  },
  
  // Place a stop market order to close a position
  stopClosePosition: (symbol: string, stopPrice: number, quantity: number) => {
    return api.post('/positions/stop-close', { symbol, stopPrice, quantity })
      .then(response => response.data);
  },
  
  // Get all open orders
  getOpenOrders: () => {
    return api.get('/positions/open-orders')
      .then(response => response.data);
  },
  
  // Cancel an open order
  cancelOrder: (symbol: string, orderId: number) => {
    return api.post('/positions/cancel-order', { symbol, orderId })
      .then(response => response.data);
  },
  
  // Cancel all open orders
  cancelAllOrders: () => {
    return api.post('/positions/cancel-all-orders')
      .then(response => response.data);
  },
  
  // Place a stop market order at entry price
  stopEntryOrder: (symbol: string) => {
    return api.post('/positions/stop-entry', { symbol })
      .then(response => response.data);
  },
  
  // Place a stop market order at 1% below/above entry price
  percentStopOrder: (symbol: string) => {
    return api.post('/positions/percent-stop', { symbol })
      .then(response => response.data);
  },
  
  // Place a stop market order at 2% below/above entry price
  percentTwoStopOrder: (symbol: string) => {
    return api.post('/positions/percent-two-stop', { symbol })
      .then(response => response.data);
  }
};

export default positionsAPI; 