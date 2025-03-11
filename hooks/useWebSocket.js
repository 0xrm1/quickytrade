/**
 * WebSocket Hook'u
 * 
 * Bu hook, WebSocket bağlantılarını yönetmek ve paylaşmak için kullanılır.
 * Tek bir WebSocket bağlantısı üzerinden birden fazla veri akışı sağlar ve
 * bağlantı durumunu, hataları ve mesajları yönetir.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import pako from 'pako';

// WebSocket bağlantı durumları
const WS_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

// Paylaşılan WebSocket bağlantıları
const sharedWebSockets = {};

// Eşik değerleri
const DEFAULT_THRESHOLDS = {
  price: 0.1, // %0.1 fiyat değişimi
  volume: 1.0, // %1 hacim değişimi
};

/**
 * WebSocket bağlantısı için özelleştirilmiş hook
 * 
 * @param {string} url - WebSocket URL'si
 * @param {Object} options - WebSocket seçenekleri
 * @param {Function} options.onMessage - Mesaj alındığında çağrılacak fonksiyon
 * @param {Function} options.onOpen - Bağlantı açıldığında çağrılacak fonksiyon
 * @param {Function} options.onClose - Bağlantı kapandığında çağrılacak fonksiyon
 * @param {Function} options.onError - Hata oluştuğunda çağrılacak fonksiyon
 * @param {boolean} options.autoReconnect - Otomatik yeniden bağlanma
 * @param {number} options.reconnectInterval - Yeniden bağlanma aralığı (ms)
 * @param {number} options.maxReconnectAttempts - Maksimum yeniden bağlanma denemesi
 * @param {boolean} options.compress - Mesajları sıkıştırma
 * @param {Object} options.thresholds - Eşik değerleri
 * @returns {Object} WebSocket durumu ve kontrol fonksiyonları
 */
export function useWebSocket(url, options = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    compress = true,
    thresholds = DEFAULT_THRESHOLDS,
  } = options;
  
  // WebSocket bağlantı durumu
  const [readyState, setReadyState] = useState(WS_STATES.CLOSED);
  
  // Son alınan mesaj
  const [lastMessage, setLastMessage] = useState(null);
  
  // Hata durumu
  const [error, setError] = useState(null);
  
  // Yeniden bağlanma sayacı
  const reconnectCount = useRef(0);
  
  // Zamanlayıcı referansı
  const reconnectTimerRef = useRef(null);
  
  // Son veri önbelleği
  const lastDataCache = useRef({});
  
  // WebSocket referansı
  const wsRef = useRef(null);
  
  // Bağlantıyı kapat
  const close = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WS_STATES.OPEN) {
      wsRef.current.close();
    }
    
    // Zamanlayıcıyı temizle
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);
  
  // Mesaj gönder
  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WS_STATES.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
      return true;
    }
    return false;
  }, []);
  
  // Abone ol
  const subscribe = useCallback((params) => {
    return sendMessage({
      method: 'SUBSCRIBE',
      params,
      id: Date.now(),
    });
  }, [sendMessage]);
  
  // Aboneliği iptal et
  const unsubscribe = useCallback((params) => {
    return sendMessage({
      method: 'UNSUBSCRIBE',
      params,
      id: Date.now(),
    });
  }, [sendMessage]);
  
  // Eşik değerlerini kontrol et
  const checkThresholds = useCallback((newData, symbol, type) => {
    if (!lastDataCache.current[symbol]) {
      lastDataCache.current[symbol] = {};
    }
    
    const lastData = lastDataCache.current[symbol][type];
    
    // İlk veri ise, önbelleğe al ve true döndür
    if (!lastData) {
      lastDataCache.current[symbol][type] = newData;
      return true;
    }
    
    let shouldUpdate = false;
    
    // Fiyat değişimi kontrolü
    if (newData.price && lastData.price) {
      const priceChange = Math.abs((newData.price - lastData.price) / lastData.price * 100);
      if (priceChange >= thresholds.price) {
        shouldUpdate = true;
      }
    }
    
    // Hacim değişimi kontrolü
    if (newData.volume && lastData.volume) {
      const volumeChange = Math.abs((newData.volume - lastData.volume) / lastData.volume * 100);
      if (volumeChange >= thresholds.volume) {
        shouldUpdate = true;
      }
    }
    
    // Eşik değeri aşıldıysa, önbelleği güncelle
    if (shouldUpdate) {
      lastDataCache.current[symbol][type] = newData;
    }
    
    return shouldUpdate;
  }, [thresholds]);
  
  // Mesajı işle
  const processMessage = useCallback((event) => {
    try {
      let data;
      
      // Sıkıştırılmış mesajları aç
      if (compress && event.data instanceof Blob) {
        const blob = event.data;
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const compressed = new Uint8Array(e.target.result);
            const decompressed = pako.inflate(compressed, { to: 'string' });
            data = JSON.parse(decompressed);
            
            // Eşik değeri kontrolü
            if (data.stream && data.data) {
              const [streamType, symbol] = data.stream.split('@');
              const shouldUpdate = checkThresholds(data.data, symbol, streamType);
              
              if (shouldUpdate) {
                setLastMessage(data);
                if (onMessage) onMessage(data);
              }
            } else {
              setLastMessage(data);
              if (onMessage) onMessage(data);
            }
          } catch (error) {
            console.error('WebSocket mesajı işlenirken hata:', error);
            setError(error);
            if (onError) onError(error);
          }
        };
        
        reader.readAsArrayBuffer(blob);
      } else {
        // Normal mesajları işle
        data = JSON.parse(event.data);
        
        // Eşik değeri kontrolü
        if (data.stream && data.data) {
          const [streamType, symbol] = data.stream.split('@');
          const shouldUpdate = checkThresholds(data.data, symbol, streamType);
          
          if (shouldUpdate) {
            setLastMessage(data);
            if (onMessage) onMessage(data);
          }
        } else {
          setLastMessage(data);
          if (onMessage) onMessage(data);
        }
      }
    } catch (error) {
      console.error('WebSocket mesajı işlenirken hata:', error);
      setError(error);
      if (onError) onError(error);
    }
  }, [compress, onMessage, onError, checkThresholds]);
  
  // WebSocket bağlantısını oluştur
  const createWebSocket = useCallback(() => {
    // Paylaşılan WebSocket'i kontrol et
    if (sharedWebSockets[url]) {
      wsRef.current = sharedWebSockets[url];
      setReadyState(wsRef.current.readyState);
      return;
    }
    
    // Yeni WebSocket bağlantısı oluştur
    const ws = new WebSocket(url);
    
    // Bağlantıyı paylaşılan WebSocket'lere ekle
    sharedWebSockets[url] = ws;
    wsRef.current = ws;
    
    // Bağlantı açıldığında
    ws.onopen = (event) => {
      setReadyState(WS_STATES.OPEN);
      setError(null);
      reconnectCount.current = 0;
      
      if (onOpen) onOpen(event);
    };
    
    // Mesaj alındığında
    ws.onmessage = processMessage;
    
    // Bağlantı kapandığında
    ws.onclose = (event) => {
      setReadyState(WS_STATES.CLOSED);
      
      // Paylaşılan WebSocket'ten kaldır
      delete sharedWebSockets[url];
      
      if (onClose) onClose(event);
      
      // Otomatik yeniden bağlanma
      if (autoReconnect && reconnectCount.current < maxReconnectAttempts) {
        reconnectCount.current += 1;
        reconnectTimerRef.current = setTimeout(() => {
          createWebSocket();
        }, reconnectInterval);
      }
    };
    
    // Hata oluştuğunda
    ws.onerror = (event) => {
      setError(event);
      if (onError) onError(event);
    };
  }, [
    url,
    onOpen,
    onClose,
    onError,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    processMessage,
  ]);
  
  // WebSocket bağlantısını başlat
  useEffect(() => {
    createWebSocket();
    
    // Temizleme fonksiyonu
    return () => {
      close();
    };
  }, [url, createWebSocket, close]);
  
  return {
    readyState,
    lastMessage,
    error,
    sendMessage,
    subscribe,
    unsubscribe,
    close,
    READY_STATE: WS_STATES,
  };
}

export default useWebSocket; 