import api from './config';
import { WatchlistItem, TickerData } from '../../components/Watchlist/types';

/**
 * Watchlist API servisi
 * İzleme listesi ile ilgili tüm API isteklerini yönetir
 */
const watchlistAPI = {
  /**
   * Belirli bir listeye ait izleme listesini getirir
   * @param listId - Liste ID'si (opsiyonel)
   * @returns İzleme listesi verileri
   */
  getWatchlist: async (listId?: number): Promise<WatchlistItem[]> => {
    const response = await api.get('/watchlist', { params: { listId } });
    return response.data;
  },
  
  /**
   * İzleme listesine yeni bir sembol ekler
   * @param symbol - Eklenecek sembol
   * @param listId - Liste ID'si (varsayılan: 1)
   * @returns Güncellenmiş izleme listesi
   */
  addSymbol: async (symbol: string, listId: number = 1): Promise<WatchlistItem[]> => {
    const response = await api.post('/watchlist/add', { symbol, listId });
    return response.data;
  },
  
  /**
   * İzleme listesinden bir sembolü kaldırır
   * @param symbol - Kaldırılacak sembol
   * @param listId - Liste ID'si (varsayılan: 1)
   * @returns Güncellenmiş izleme listesi
   */
  removeSymbol: async (symbol: string, listId: number = 1): Promise<WatchlistItem[]> => {
    const response = await api.delete(`/watchlist/remove/${symbol}`, { params: { listId } });
    return response.data;
  },
  
  /**
   * İzleme listesini sunucu ile senkronize eder
   * @param watchlist - Senkronize edilecek izleme listesi
   * @returns Senkronize edilmiş izleme listesi
   */
  syncWatchlist: async (watchlist: WatchlistItem[]): Promise<WatchlistItem[]> => {
    const response = await api.post('/watchlist/sync', { watchlist });
    return response.data;
  },
  
  /**
   * Belirli bir sembol için ticker bilgisini getirir
   * @param symbol - Ticker bilgisi alınacak sembol
   * @returns Ticker verisi
   */
  getTicker: async (symbol: string): Promise<any> => {
    const response = await api.get(`/watchlist/ticker/${symbol}`);
    return response.data;
  },
  
  /**
   * Tüm mevcut sembolleri getirir
   * @returns Mevcut semboller listesi
   */
  getSymbols: async (): Promise<string[]> => {
    const response = await api.get('/watchlist/symbols');
    return response.data;
  },
  
  // Legacy methods (will be implemented later)
  addToWatchlist: (symbol: string) => {
    return api.post('/watchlist', { symbol });
  },
  
  removeFromWatchlist: (symbol: string) => {
    return api.delete(`/watchlist/${symbol}`);
  }
};

export default watchlistAPI; 