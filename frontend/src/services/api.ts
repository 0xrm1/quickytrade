import axios from 'axios';

// API base URL from environment variables or fallback to the deployed URL
const API_URL = process.env.REACT_APP_API_URL || 'https://oriontrade-api.onrender.com/api';

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