/**
 * priceTracker.js
 * 
 * Bu dosya, fiyat değişikliklerini izleyen ve eşik değerini aşan değişiklikleri
 * bildiren bir servis sağlar. Bu sayede, küçük fiyat değişikliklerinde gereksiz
 * güncellemeler önlenir ve performans iyileştirilir.
 */

import websocketService from './websocket';

// Varsayılan eşik değerleri
const DEFAULT_THRESHOLDS = {
  PERCENTAGE: 0.5, // %0.5 değişim
  ABSOLUTE: 10, // 10 birim değişim
  TIME: 30000, // 30 saniye
};

// Fiyat izleyici sınıfı
class PriceTracker {
  constructor() {
    this.prices = new Map(); // Son fiyatlar
    this.lastNotified = new Map(); // Son bildirim zamanları
    this.subscribers = new Map(); // Aboneler
    this.thresholds = { ...DEFAULT_THRESHOLDS }; // Eşik değerleri
  }
  
  /**
   * Eşik değerlerini ayarlama
   * @param {Object} thresholds - Eşik değerleri
   */
  setThresholds(thresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...thresholds,
    };
  }
  
  /**
   * Fiyat değişikliği için abone olma
   * @param {string} symbol - Sembol
   * @param {Function} callback - Geri çağırma fonksiyonu
   * @param {Object} options - Seçenekler
   * @returns {Function} - Abonelikten çıkma fonksiyonu
   */
  subscribe(symbol, callback, options = {}) {
    const symbolKey = symbol.toUpperCase();
    
    // Sembol için abonelik listesi yoksa oluştur
    if (!this.subscribers.has(symbolKey)) {
      this.subscribers.set(symbolKey, new Set());
      
      // WebSocket'e abone ol
      this._subscribeToWebSocket(symbolKey);
    }
    
    // Callback'i abonelik listesine ekle
    const subscribers = this.subscribers.get(symbolKey);
    const subscriber = { callback, options };
    subscribers.add(subscriber);
    
    // Abonelikten çıkma fonksiyonunu döndür
    return () => {
      this._unsubscribe(symbolKey, subscriber);
    };
  }
  
  /**
   * Abonelikten çıkma
   * @param {string} symbol - Sembol
   * @param {Object} subscriber - Abone
   */
  _unsubscribe(symbol, subscriber) {
    const symbolKey = symbol.toUpperCase();
    
    if (!this.subscribers.has(symbolKey)) return;
    
    const subscribers = this.subscribers.get(symbolKey);
    subscribers.delete(subscriber);
    
    // Sembol için başka abone kalmadıysa, WebSocket aboneliğini iptal et
    if (subscribers.size === 0) {
      this.subscribers.delete(symbolKey);
      this.prices.delete(symbolKey);
      this.lastNotified.delete(symbolKey);
    }
  }
  
  /**
   * WebSocket'e abone olma
   * @param {string} symbol - Sembol
   */
  _subscribeToWebSocket(symbol) {
    const lowerSymbol = symbol.toLowerCase();
    
    // WebSocket fiyat akışına abone ol
    websocketService.usePriceStream(lowerSymbol, (data) => {
      this._handlePriceUpdate(symbol, data);
    });
  }
  
  /**
   * Fiyat güncellemesini işleme
   * @param {string} symbol - Sembol
   * @param {Object} data - Fiyat verisi
   */
  _handlePriceUpdate(symbol, data) {
    const symbolKey = symbol.toUpperCase();
    const currentPrice = parseFloat(data.c); // Güncel fiyat
    const lastPrice = this.prices.get(symbolKey); // Son fiyat
    const now = Date.now();
    
    // İlk fiyat ise, kaydet ve bildir
    if (lastPrice === undefined) {
      this.prices.set(symbolKey, currentPrice);
      this.lastNotified.set(symbolKey, now);
      this._notifySubscribers(symbolKey, currentPrice, data);
      return;
    }
    
    // Fiyat değişimi hesapla
    const absoluteChange = Math.abs(currentPrice - lastPrice);
    const percentageChange = (absoluteChange / lastPrice) * 100;
    
    // Son bildirim zamanı
    const lastNotifiedTime = this.lastNotified.get(symbolKey) || 0;
    const timeSinceLastNotification = now - lastNotifiedTime;
    
    // Eşik değerlerini kontrol et
    const thresholdOptions = this.subscribers.get(symbolKey)?.size > 0
      ? Array.from(this.subscribers.get(symbolKey)).reduce((acc, { options }) => {
          return {
            percentage: Math.min(acc.percentage, options.percentage || this.thresholds.PERCENTAGE),
            absolute: Math.min(acc.absolute, options.absolute || this.thresholds.ABSOLUTE),
            time: Math.min(acc.time, options.time || this.thresholds.TIME),
          };
        }, { ...this.thresholds })
      : this.thresholds;
    
    // Eşik değerlerini aşıyorsa veya zaman aşımı olduysa bildir
    if (
      percentageChange >= thresholdOptions.percentage ||
      absoluteChange >= thresholdOptions.absolute ||
      timeSinceLastNotification >= thresholdOptions.time
    ) {
      this.prices.set(symbolKey, currentPrice);
      this.lastNotified.set(symbolKey, now);
      this._notifySubscribers(symbolKey, currentPrice, data);
    } else {
      // Eşik değerlerini aşmıyorsa, sadece fiyatı güncelle
      this.prices.set(symbolKey, currentPrice);
    }
  }
  
  /**
   * Abonelere bildirim gönderme
   * @param {string} symbol - Sembol
   * @param {number} price - Fiyat
   * @param {Object} data - Fiyat verisi
   */
  _notifySubscribers(symbol, price, data) {
    const symbolKey = symbol.toUpperCase();
    
    if (!this.subscribers.has(symbolKey)) return;
    
    const subscribers = this.subscribers.get(symbolKey);
    subscribers.forEach(({ callback }) => {
      try {
        callback(price, data);
      } catch (error) {
        console.error(`Price notification error for ${symbolKey}:`, error);
      }
    });
  }
  
  /**
   * Sembol için son fiyatı alma
   * @param {string} symbol - Sembol
   * @returns {number|undefined} - Son fiyat
   */
  getLastPrice(symbol) {
    const symbolKey = symbol.toUpperCase();
    return this.prices.get(symbolKey);
  }
  
  /**
   * Tüm abonelikleri temizleme
   */
  clearAll() {
    this.prices.clear();
    this.lastNotified.clear();
    this.subscribers.clear();
  }
}

// Singleton örneği
const priceTracker = new PriceTracker();

export default priceTracker; 