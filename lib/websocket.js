/**
 * WebSocket Yardımcı Fonksiyonları
 * 
 * Bu modül, WebSocket mesajlarının sıkıştırılması ve açılması için
 * yardımcı fonksiyonlar sağlar. Pako kütüphanesi kullanılarak mesajlar
 * sıkıştırılır ve açılır.
 */

import pako from 'pako';

/**
 * WebSocket mesajını sıkıştır
 * 
 * @param {Object|string} data - Sıkıştırılacak veri
 * @returns {Uint8Array} Sıkıştırılmış veri
 */
export function compressMessage(data) {
  try {
    // Veriyi JSON'a dönüştür (eğer zaten string değilse)
    const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Veriyi sıkıştır
    const compressed = pako.deflate(jsonData, { to: 'Uint8Array' });
    
    return compressed;
  } catch (error) {
    console.error('WebSocket mesajı sıkıştırılırken hata:', error);
    throw error;
  }
}

/**
 * Sıkıştırılmış WebSocket mesajını aç
 * 
 * @param {Uint8Array|Blob} data - Açılacak sıkıştırılmış veri
 * @returns {Promise<Object|string>} Açılmış veri
 */
export async function decompressMessage(data) {
  try {
    let compressedData;
    
    // Blob'u Uint8Array'e dönüştür
    if (data instanceof Blob) {
      compressedData = new Uint8Array(await data.arrayBuffer());
    } else {
      compressedData = data;
    }
    
    // Veriyi aç
    const decompressed = pako.inflate(compressedData, { to: 'string' });
    
    // JSON'a dönüştürmeyi dene
    try {
      return JSON.parse(decompressed);
    } catch (e) {
      // JSON'a dönüştürülemezse, string olarak döndür
      return decompressed;
    }
  } catch (error) {
    console.error('WebSocket mesajı açılırken hata:', error);
    throw error;
  }
}

/**
 * WebSocket mesajını işle
 * 
 * @param {MessageEvent} event - WebSocket mesaj olayı
 * @param {boolean} compressed - Mesajın sıkıştırılmış olup olmadığı
 * @returns {Promise<Object|string>} İşlenmiş mesaj
 */
export async function processWebSocketMessage(event, compressed = true) {
  try {
    // Sıkıştırılmış mesaj
    if (compressed && event.data instanceof Blob) {
      return await decompressMessage(event.data);
    }
    
    // Normal mesaj
    if (typeof event.data === 'string') {
      try {
        return JSON.parse(event.data);
      } catch (e) {
        return event.data;
      }
    }
    
    return event.data;
  } catch (error) {
    console.error('WebSocket mesajı işlenirken hata:', error);
    throw error;
  }
}

/**
 * Eşik değerlerine göre veriyi filtrele
 * 
 * @param {Object} newData - Yeni veri
 * @param {Object} lastData - Son veri
 * @param {Object} thresholds - Eşik değerleri
 * @returns {boolean} Verinin güncellenmesi gerekip gerekmediği
 */
export function shouldUpdateData(newData, lastData, thresholds = { price: 0.1, volume: 1.0 }) {
  // İlk veri ise, güncelle
  if (!lastData) {
    return true;
  }
  
  // Fiyat değişimi kontrolü
  if (newData.price !== undefined && lastData.price !== undefined) {
    const priceChange = Math.abs((newData.price - lastData.price) / lastData.price * 100);
    if (priceChange >= thresholds.price) {
      return true;
    }
  }
  
  // Hacim değişimi kontrolü
  if (newData.volume !== undefined && lastData.volume !== undefined) {
    const volumeChange = Math.abs((newData.volume - lastData.volume) / lastData.volume * 100);
    if (volumeChange >= thresholds.volume) {
      return true;
    }
  }
  
  // Zaman kontrolü (5 saniyeden fazla geçtiyse güncelle)
  if (newData.time !== undefined && lastData.time !== undefined) {
    const timeChange = Math.abs(newData.time - lastData.time);
    if (timeChange >= 5000) {
      return true;
    }
  }
  
  return false;
}

/**
 * WebSocket bağlantısı oluştur
 * 
 * @param {string} url - WebSocket URL'si
 * @param {Object} options - WebSocket seçenekleri
 * @returns {WebSocket} WebSocket bağlantısı
 */
export function createWebSocket(url, options = {}) {
  const {
    protocols,
    onOpen,
    onMessage,
    onClose,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;
  
  // WebSocket bağlantısı oluştur
  const ws = new WebSocket(url, protocols);
  
  // Yeniden bağlanma sayacı
  let reconnectCount = 0;
  let reconnectTimer = null;
  
  // Bağlantı açıldığında
  ws.onopen = (event) => {
    reconnectCount = 0;
    if (onOpen) onOpen(event);
  };
  
  // Mesaj alındığında
  ws.onmessage = async (event) => {
    try {
      const data = await processWebSocketMessage(event);
      if (onMessage) onMessage(data);
    } catch (error) {
      console.error('WebSocket mesajı işlenirken hata:', error);
      if (onError) onError(error);
    }
  };
  
  // Bağlantı kapandığında
  ws.onclose = (event) => {
    if (onClose) onClose(event);
    
    // Otomatik yeniden bağlanma
    if (autoReconnect && reconnectCount < maxReconnectAttempts) {
      reconnectCount += 1;
      reconnectTimer = setTimeout(() => {
        const newWs = createWebSocket(url, options);
        // Eski WebSocket referansını güncelle
        Object.assign(ws, newWs);
      }, reconnectInterval);
    }
  };
  
  // Hata oluştuğunda
  ws.onerror = (event) => {
    if (onError) onError(event);
  };
  
  // WebSocket'i kapat
  const originalClose = ws.close;
  ws.close = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    return originalClose.call(ws);
  };
  
  return ws;
}

export default {
  compressMessage,
  decompressMessage,
  processWebSocketMessage,
  shouldUpdateData,
  createWebSocket,
}; 