import { useState, useCallback } from 'react';
import { Order } from '../types';
import { positionsAPI } from '../../../services/api';

interface UseOrdersReturn {
  openOrders: Order[];
  fetchOpenOrders: () => Promise<void>;
  cancelOrder: (symbol: string, orderId: number) => Promise<void>;
  cancelAllOrders: () => Promise<void>;
}

export const useOrders = (): UseOrdersReturn => {
  const [openOrders, setOpenOrders] = useState<Order[]>([]);

  // Açık emirleri yükle
  const fetchOpenOrders = useCallback(async () => {
    try {
      const data = await positionsAPI.getOpenOrders();
      console.log('Open orders were loaded:', data);
      
      if (data.success && data.orders) {
        setOpenOrders(data.orders);
      } else {
        setOpenOrders([]);
      }
    } catch (err) {
      console.error('Error loading open orders:', err);
      // Hata olsa bile mevcut emirleri silme
    }
  }, []);

  const cancelOrder = useCallback(async (symbol: string, orderId: number) => {
    try {
      await positionsAPI.cancelOrder(symbol, orderId);
      console.log('Order cancelled successfully');
      fetchOpenOrders();
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  }, [fetchOpenOrders]);

  const cancelAllOrders = useCallback(async () => {
    try {
      await positionsAPI.cancelAllOrders();
      console.log('All orders cancelled successfully');
      fetchOpenOrders();
    } catch (err) {
      console.error('Error cancelling all orders:', err);
    }
  }, [fetchOpenOrders]);

  return {
    openOrders,
    fetchOpenOrders,
    cancelOrder,
    cancelAllOrders
  };
}; 