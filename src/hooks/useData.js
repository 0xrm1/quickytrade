/**
 * useData.js
 * 
 * Bu dosya, React Query kullanarak veri çekme işlemleri için özel hook'lar sağlar.
 * API çağrılarını optimize eder, önbelleğe alır ve otomatik yeniden doğrulama yapar.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import cache from '../services/cache';

// Sorgu anahtarları - önbellek yönetimi için kullanılır
export const QueryKeys = {
  PROFILE: 'profile',
  MARKET_PRICES: 'marketPrices',
  SYMBOL_DETAILS: 'symbolDetails',
  MARKET_OVERVIEW: 'marketOverview',
  ORDERS: 'orders',
  ORDER_HISTORY: 'orderHistory',
  BALANCE: 'balance',
  POSITIONS: 'positions',
  TRANSACTIONS: 'transactions',
};

// Kullanıcı profili hook'u
export const useProfile = () => {
  return useQuery({
    queryKey: [QueryKeys.PROFILE],
    queryFn: api.auth.getProfile,
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca "taze" kabul et
    cacheTime: 10 * 60 * 1000, // 10 dakika önbellekte tut
    retry: 1, // Hata durumunda 1 kez yeniden dene
    // Önbellekten veri alma
    initialData: () => cache.get(QueryKeys.PROFILE),
    // Başarılı yanıtı önbelleğe alma
    onSuccess: (data) => {
      cache.set(QueryKeys.PROFILE, data, cache.TTL.MEDIUM);
    },
  });
};

// Piyasa fiyatları hook'u
export const useMarketPrices = (symbols, options = {}) => {
  const queryKey = [QueryKeys.MARKET_PRICES, symbols];
  const cacheKey = `${QueryKeys.MARKET_PRICES}_${symbols?.join('_') || 'all'}`;
  
  return useQuery({
    queryKey,
    queryFn: () => api.market.getPrices(symbols),
    staleTime: 10 * 1000, // 10 saniye boyunca "taze" kabul et
    refetchInterval: 30 * 1000, // 30 saniyede bir otomatik yenile
    // Önbellekten veri alma
    initialData: () => cache.get(cacheKey),
    // Başarılı yanıtı önbelleğe alma
    onSuccess: (data) => {
      cache.set(cacheKey, data, cache.TTL.SHORT);
    },
    ...options,
  });
};

// Sembol detayları hook'u
export const useSymbolDetails = (symbol, options = {}) => {
  const queryKey = [QueryKeys.SYMBOL_DETAILS, symbol];
  const cacheKey = `${QueryKeys.SYMBOL_DETAILS}_${symbol}`;
  
  return useQuery({
    queryKey,
    queryFn: () => api.market.getSymbolDetails(symbol),
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca "taze" kabul et
    enabled: !!symbol, // Sembol varsa etkinleştir
    // Önbellekten veri alma
    initialData: () => symbol ? cache.get(cacheKey) : null,
    // Başarılı yanıtı önbelleğe alma
    onSuccess: (data) => {
      if (symbol) {
        cache.set(cacheKey, data, cache.TTL.MEDIUM);
      }
    },
    ...options,
  });
};

// Piyasa genel bakış hook'u
export const useMarketOverview = (options = {}) => {
  return useQuery({
    queryKey: [QueryKeys.MARKET_OVERVIEW],
    queryFn: api.market.getMarketOverview,
    staleTime: 60 * 1000, // 1 dakika boyunca "taze" kabul et
    refetchInterval: 2 * 60 * 1000, // 2 dakikada bir otomatik yenile
    // Önbellekten veri alma
    initialData: () => cache.get(QueryKeys.MARKET_OVERVIEW),
    // Başarılı yanıtı önbelleğe alma
    onSuccess: (data) => {
      cache.set(QueryKeys.MARKET_OVERVIEW, data, cache.TTL.SHORT);
    },
    ...options,
  });
};

// Emirler hook'u
export const useOrders = (status, options = {}) => {
  const queryKey = [QueryKeys.ORDERS, status];
  const cacheKey = `${QueryKeys.ORDERS}_${status || 'all'}`;
  
  return useQuery({
    queryKey,
    queryFn: () => api.trading.getOrders(status),
    staleTime: 10 * 1000, // 10 saniye boyunca "taze" kabul et
    refetchInterval: 30 * 1000, // 30 saniyede bir otomatik yenile
    // Önbellekten veri alma
    initialData: () => cache.get(cacheKey),
    // Başarılı yanıtı önbelleğe alma
    onSuccess: (data) => {
      cache.set(cacheKey, data, cache.TTL.SHORT);
    },
    ...options,
  });
};

// Emir geçmişi hook'u
export const useOrderHistory = (filters, options = {}) => {
  const filterKey = JSON.stringify(filters || {});
  const queryKey = [QueryKeys.ORDER_HISTORY, filters];
  const cacheKey = `${QueryKeys.ORDER_HISTORY}_${filterKey}`;
  
  return useQuery({
    queryKey,
    queryFn: () => api.trading.getOrderHistory(filters),
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca "taze" kabul et
    // Önbellekten veri alma
    initialData: () => cache.get(cacheKey),
    // Başarılı yanıtı önbelleğe alma
    onSuccess: (data) => {
      cache.set(cacheKey, data, cache.TTL.MEDIUM);
    },
    ...options,
  });
};

// Bakiye hook'u
export const useBalance = (options = {}) => {
  return useQuery({
    queryKey: [QueryKeys.BALANCE],
    queryFn: api.portfolio.getBalance,
    staleTime: 30 * 1000, // 30 saniye boyunca "taze" kabul et
    refetchInterval: 60 * 1000, // 1 dakikada bir otomatik yenile
    // Önbellekten veri alma
    initialData: () => cache.get(QueryKeys.BALANCE),
    // Başarılı yanıtı önbelleğe alma
    onSuccess: (data) => {
      cache.set(QueryKeys.BALANCE, data, cache.TTL.SHORT);
    },
    ...options,
  });
};

// Pozisyonlar hook'u
export const usePositions = (options = {}) => {
  return useQuery({
    queryKey: [QueryKeys.POSITIONS],
    queryFn: api.portfolio.getPositions,
    staleTime: 10 * 1000, // 10 saniye boyunca "taze" kabul et
    refetchInterval: 30 * 1000, // 30 saniyede bir otomatik yenile
    // Önbellekten veri alma
    initialData: () => cache.get(QueryKeys.POSITIONS),
    // Başarılı yanıtı önbelleğe alma
    onSuccess: (data) => {
      cache.set(QueryKeys.POSITIONS, data, cache.TTL.SHORT);
    },
    ...options,
  });
};

// İşlemler hook'u
export const useTransactions = (filters, options = {}) => {
  const filterKey = JSON.stringify(filters || {});
  const queryKey = [QueryKeys.TRANSACTIONS, filters];
  const cacheKey = `${QueryKeys.TRANSACTIONS}_${filterKey}`;
  
  return useQuery({
    queryKey,
    queryFn: () => api.portfolio.getTransactions(filters),
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca "taze" kabul et
    // Önbellekten veri alma
    initialData: () => cache.get(cacheKey),
    // Başarılı yanıtı önbelleğe alma
    onSuccess: (data) => {
      cache.set(cacheKey, data, cache.TTL.MEDIUM);
    },
    ...options,
  });
};

// Emir oluşturma mutation hook'u
export const usePlaceOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.trading.placeOrder,
    onSuccess: () => {
      // Başarılı olduğunda emirleri ve bakiyeyi yeniden çek
      queryClient.invalidateQueries([QueryKeys.ORDERS]);
      queryClient.invalidateQueries([QueryKeys.BALANCE]);
      queryClient.invalidateQueries([QueryKeys.POSITIONS]);
      
      // Önbelleği temizle
      cache.clearByPrefix(QueryKeys.ORDERS);
      cache.remove(QueryKeys.BALANCE);
      cache.remove(QueryKeys.POSITIONS);
    },
  });
};

// Emir iptal etme mutation hook'u
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.trading.cancelOrder,
    onSuccess: () => {
      // Başarılı olduğunda emirleri yeniden çek
      queryClient.invalidateQueries([QueryKeys.ORDERS]);
      
      // Önbelleği temizle
      cache.clearByPrefix(QueryKeys.ORDERS);
    },
  });
};

// Giriş yapma mutation hook'u
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.auth.login,
    onSuccess: (data) => {
      // Token'ı kaydet
      localStorage.setItem('auth_token', data.token);
      // Kullanıcı verilerini yeniden çek
      queryClient.invalidateQueries([QueryKeys.PROFILE]);
      
      // Önbelleği temizle
      cache.remove(QueryKeys.PROFILE);
    },
  });
};

// Çıkış yapma mutation hook'u
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      // Token'ı kaldır
      localStorage.removeItem('auth_token');
      // Önbelleği temizle
      queryClient.clear();
      cache.clearAll();
    },
  });
}; 