import React from 'react';

// Pozisyon verisi için interface
export interface Position {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  roe?: string;
  side?: string;
}

// Emir verisi için interface
export interface Order {
  symbol: string;
  orderId: number;
  type: string;
  side: string;
  price: string;
  stopPrice?: string;
  origQty: string;
  executedQty: string;
  reduceOnly: boolean;
  time: number;
}

// Ticker verisi için interface
export interface TickerData {
  [key: string]: {
    price: string;
    priceChangePercent: string;
  };
}

// Input değerleri için interface
export interface InputValue {
  price: string;
  quantity: string;
}

// Tüm input değerleri için interface
export interface InputValues {
  [key: string]: InputValue;
}

// Yüzde değerleri için interface
export interface PercentageValues {
  [key: string]: number;
}

// Yüzde input gösterimi için interface
export interface ShowPercentInput {
  [key: string]: boolean;
}

// Yüzde seçici gösterimi için interface
export interface ShowPercentSelector {
  [key: string]: boolean;
}

// Bilgi modalı props
export interface InfoModalProps {
  show: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

// Stop loss modalı props
export interface StopLossModalProps {
  show: boolean;
  symbol: string;
  currentPrice: number;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

// Take profit modalı props
export interface TakeProfitModalProps {
  show: boolean;
  symbol: string;
  currentPrice: number;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
} 