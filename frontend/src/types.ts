/**
 * Uygulama genelinde kullanılan tip tanımlamaları
 */

/**
 * İzleme listesi öğesi
 */
export interface WatchlistItem {
  symbol: string;
  listId: number;
  createdAt?: string;
  updatedAt?: string;
  addedAt?: string;
}

/**
 * Ticker verisi
 */
export interface TickerData {
  [symbol: string]: {
    price: string;
    priceChangePercent: string;
  };
}

/**
 * Tek bir sembol için ticker verisi
 */
export interface SingleTickerData {
  symbol: string;
  price?: string;
  lastPrice?: string;
  priceChangePercent?: string;
  volume?: string;
  high24h?: string;
  low24h?: string;
  lastUpdated?: string;
}

/**
 * Kullanıcı tipi
 */
export interface User {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * İşlem yönü
 */
export type OrderSide = 'long' | 'short';

/**
 * İşlem durumu
 */
export type OrderStatus = 'open' | 'closed' | 'pending' | 'canceled' | 'rejected';

/**
 * İşlem tipi
 */
export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  amount: number;
  entryPrice: number;
  exitPrice?: number;
  status: OrderStatus;
  pnl?: number;
  createdAt: string;
  closedAt?: string;
}

/**
 * Buton ayarları
 */
export interface ButtonSettings {
  longAmounts: number[];
  longLabels: string[];
  shortAmounts: number[];
  shortLabels: string[];
}

/**
 * Form ayarları
 */
export interface FormSettings {
  defaultAmount: number;
  defaultSide: OrderSide;
} 