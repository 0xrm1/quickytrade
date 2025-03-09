import axios from 'axios';

// Base API URL
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

// Watchlist API functions
export const watchlistAPI = {
  // Get watchlist
  getWatchlist: (listId?: number) => {
    return api.get('/watchlist', { params: { listId } })
      .then(response => response.data);
  },
  
  // Add symbol to watchlist
  addSymbol: (symbol: string, listId: number = 1) => {
    return api.post('/watchlist/add', { symbol, listId })
      .then(response => response.data);
  },
  
  // Remove symbol from watchlist
  removeSymbol: (symbol: string, listId: number = 1) => {
    return api.delete(`/watchlist/remove/${symbol}`, { params: { listId } })
      .then(response => response.data);
  },
  
  // Sync watchlist with backend
  syncWatchlist: (watchlist: any[]) => {
    return api.post('/watchlist/sync', { watchlist })
      .then(response => response.data);
  },
  
  // Get ticker information for a symbol
  getTicker: (symbol: string) => {
    return api.get(`/watchlist/ticker/${symbol}`)
      .then(response => response.data);
  },
  
  // Get all available symbols
  getSymbols: () => {
    return api.get('/watchlist/symbols')
      .then(response => response.data);
  }
};

// Terminal API functions
export const terminalAPI = {
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

// API services
const apiService = {
  // User authentication
  auth: {
    register: (email: string, password: string, binanceApiKey?: string, binanceSecretKey?: string) => {
      return api.post('/users/register', {
        email,
        password,
        binanceApiKey,
        binanceSecretKey
      });
    },
    login: (email: string, password: string) => {
      return api.post('/users/login', {
        email,
        password
      });
    }
  },

  // User profile
  user: {
    getProfile: () => {
      return api.get('/users/profile');
    },
    updateApiKeys: (binanceApiKey: string, binanceSecretKey: string) => {
      return api.put('/users/api-keys', {
        binanceApiKey,
        binanceSecretKey
      });
    },
    getApiKeys: () => {
      return api.get('/users/api-keys');
    }
  },
  
  // These will be implemented later
  watchlist: {
    getWatchlist: () => {
      return api.get('/watchlist');
    },
    addToWatchlist: (symbol: string) => {
      return api.post('/watchlist', { symbol });
    },
    removeFromWatchlist: (symbol: string) => {
      return api.delete(`/watchlist/${symbol}`);
    }
  },
  
  positions: {
    getPositions: () => {
      return api.get('/positions');
    },
    getPosition: (id: number) => {
      return api.get(`/positions/${id}`);
    },
    createPosition: (positionData: any) => {
      return api.post('/positions', positionData);
    },
    updatePosition: (id: number, positionData: any) => {
      return api.put(`/positions/${id}`, positionData);
    },
    closePosition: (id: number) => {
      return api.delete(`/positions/${id}`);
    }
  },
  
  terminal: {
    getMarketData: (symbol: string) => {
      return api.get(`/market-data/${symbol}`);
    },
    placeOrder: (orderData: any) => {
      return api.post('/orders', orderData);
    },
    getOrders: () => {
      return api.get('/orders');
    }
  },
  
  quickButtons: {
    getQuickButtons: () => {
      return api.get('/quick-buttons');
    },
    createQuickButton: (buttonData: any) => {
      return api.post('/quick-buttons', buttonData);
    },
    updateQuickButton: (id: number, buttonData: any) => {
      return api.put(`/quick-buttons/${id}`, buttonData);
    },
    deleteQuickButton: (id: number) => {
      return api.delete(`/quick-buttons/${id}`);
    }
  }
};

export default apiService; 