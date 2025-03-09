import { useState, useCallback } from 'react';
import { Order } from '../types';

interface UseOrdersReturn {
  openOrders: Order[];
  fetchOpenOrders: () => Promise<void>;
}

export const useOrders = (): UseOrdersReturn => {
  const [openOrders, setOpenOrders] = useState<Order[]>([]);

  // Açık emirleri yükle - API henüz eklenmediği için boş bir fonksiyon
  const fetchOpenOrders = useCallback(async () => {
    try {
      // API henüz eklenmediği için boş bir dizi döndür
      setOpenOrders([]);
    } catch (err) {
      console.error('Açık emirler yüklenirken hata:', err);
      // Hata olsa bile mevcut emirleri silme
    }
  }, []);

  return {
    openOrders,
    fetchOpenOrders
  };
}; 