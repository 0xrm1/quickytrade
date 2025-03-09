import api from './config';

/**
 * Kullanıcı profili API servisi
 */
const userAPI = {
  // Get user profile
  getProfile: () => {
    return api.get('/users/profile');
  },
  
  // Update API keys
  updateApiKeys: (binanceApiKey: string, binanceSecretKey: string) => {
    return api.put('/users/api-keys', {
      binanceApiKey,
      binanceSecretKey
    });
  },
  
  // Get API keys
  getApiKeys: () => {
    return api.get('/users/api-keys');
  }
};

export default userAPI; 