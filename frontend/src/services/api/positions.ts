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
  }
};

export default positionsAPI; 