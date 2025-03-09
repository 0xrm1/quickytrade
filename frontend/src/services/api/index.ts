import api, { API_URL } from './config';
import { createWebSocketConnection } from './websocket';
import watchlistAPI from './watchlist';
import terminalAPI from './terminal';
import positionsAPI from './positions';
import quickButtonsAPI from './quickButtons';
import authAPI from './auth';
import userAPI from './user';

/**
 * Tüm API servislerini dışa aktaran ana dosya
 */

// Export individual APIs
export {
  API_URL,
  createWebSocketConnection,
  watchlistAPI,
  terminalAPI,
  positionsAPI,
  quickButtonsAPI
};

// Export combined API service
const apiService = {
  auth: authAPI,
  user: userAPI,
  watchlist: watchlistAPI,
  positions: positionsAPI,
  terminal: terminalAPI,
  quickButtons: quickButtonsAPI
};

export default apiService; 