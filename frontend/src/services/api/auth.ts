import api from './config';

/**
 * Kimlik doğrulama API servisi
 */
const authAPI = {
  // Register a new user
  register: (email: string, password: string, binanceApiKey?: string, binanceSecretKey?: string) => {
    return api.post('/users/register', {
      email,
      password,
      binanceApiKey,
      binanceSecretKey
    });
  },
  
  // Login user
  login: (email: string, password: string) => {
    return api.post('/users/login', {
      email,
      password
    });
  }
};

export default authAPI; 