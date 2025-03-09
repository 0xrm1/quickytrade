import api from './config';

/**
 * Hızlı butonlar API servisi
 */
const quickButtonsAPI = {
  // Get all quick buttons
  getQuickButtons: () => {
    return api.get('/quick-buttons')
      .then(response => response.data);
  },
  
  // Add a new quick button
  addQuickButton: (symbol: string, amount: number, side: 'long' | 'short') => {
    return api.post('/quick-buttons/add', { symbol, amount, side })
      .then(response => response.data);
  },
  
  // Remove a quick button
  removeQuickButton: (id: string) => {
    return api.delete(`/quick-buttons/remove/${id}`)
      .then(response => response.data);
  },
  
  // Sync quick buttons with backend
  syncQuickButtons: (quickButtons: any[]) => {
    return api.post('/quick-buttons/sync', { quickButtons })
      .then(response => response.data);
  },
  
  // Legacy methods
  createQuickButton: (buttonData: any) => {
    return api.post('/quick-buttons', buttonData)
      .then(response => response.data);
  },
  
  updateQuickButton: (id: number, buttonData: any) => {
    return api.put(`/quick-buttons/${id}`, buttonData)
      .then(response => response.data);
  },
  
  deleteQuickButton: (id: number) => {
    return api.delete(`/quick-buttons/${id}`)
      .then(response => response.data);
  }
};

export default quickButtonsAPI; 