import axios from 'axios';

// API base URL from environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  }
};

export default apiService; 