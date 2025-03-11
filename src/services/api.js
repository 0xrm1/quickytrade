/**
 * api.js
 * 
 * Bu dosya, API çağrıları için bir wrapper sağlar.
 * Axios kullanarak HTTP istekleri yapar ve React Query ile entegre çalışır.
 */

import axios from 'axios';

// API temel URL'si
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.quickytrade.com';

// Axios instance oluşturma
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 saniye timeout
});

// İstek interceptor'ı - her istekte çalışır
apiClient.interceptors.request.use(
  (config) => {
    // Token varsa ekle
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt interceptor'ı - her yanıtta çalışır
apiClient.interceptors.response.use(
  (response) => {
    // Başarılı yanıtları doğrudan döndür
    return response.data;
  },
  (error) => {
    // Hata durumunda
    if (error.response) {
      // Sunucu yanıtı ile dönen hatalar (400, 500 vb.)
      console.error('API Error:', error.response.data);
      
      // 401 Unauthorized hatası durumunda oturumu sonlandır
      if (error.response.status === 401) {
        localStorage.removeItem('auth_token');
        // Oturum sonlandırma işlemleri
      }
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      console.error('API Request Error:', error.request);
    } else {
      // İstek oluşturulurken bir hata oluştu
      console.error('API Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API fonksiyonları
const api = {
  // Kullanıcı işlemleri
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (userData) => apiClient.post('/auth/register', userData),
    logout: () => apiClient.post('/auth/logout'),
    getProfile: () => apiClient.get('/auth/profile'),
  },
  
  // Piyasa verileri
  market: {
    getPrices: (symbols) => apiClient.get('/market/prices', { params: { symbols } }),
    getSymbolDetails: (symbol) => apiClient.get(`/market/symbols/${symbol}`),
    getMarketOverview: () => apiClient.get('/market/overview'),
  },
  
  // İşlem işlemleri
  trading: {
    placeOrder: (orderData) => apiClient.post('/trading/orders', orderData),
    getOrders: (status) => apiClient.get('/trading/orders', { params: { status } }),
    cancelOrder: (orderId) => apiClient.delete(`/trading/orders/${orderId}`),
    getOrderHistory: (filters) => apiClient.get('/trading/history', { params: filters }),
  },
  
  // Portföy işlemleri
  portfolio: {
    getBalance: () => apiClient.get('/portfolio/balance'),
    getPositions: () => apiClient.get('/portfolio/positions'),
    getTransactions: (filters) => apiClient.get('/portfolio/transactions', { params: filters }),
  },
};

export default api; 