/**
 * websocket.js
 * 
 * Bu dosya, WebSocket bağlantılarını yönetmek için bir singleton servis sağlar.
 * Birden fazla bileşen aynı WebSocket bağlantısını paylaşabilir, böylece
 * gereksiz bağlantılar önlenir ve sunucu kaynakları daha verimli kullanılır.
 */

import * as pako from 'pako';

// WebSocket bağlantı URL'leri
const WS_ENDPOINTS = {
  MARKET: process.env.NEXT_PUBLIC_WS_MARKET_URL || 'wss://stream.binance.com:9443/ws',
  TRADING: process.env.NEXT_PUBLIC_WS_TRADING_URL || 'wss://api.quickytrade.com/ws/trading',
  NOTIFICATIONS: process.env.NEXT_PUBLIC_WS_NOTIFICATIONS_URL || 'wss://api.quickytrade.com/ws/notifications',
};

// Bağlantı durumları
const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
  RECONNECTING: 'reconnecting',
};

// Sıkıştırma seçenekleri
const COMPRESSION_OPTIONS = {
  NONE: 'none',
  GZIP: 'gzip',
  DEFLATE: 'deflate',
};

/**
 * Mesajı sıkıştırma
 * @param {string|object} message - Sıkıştırılacak mesaj
 * @param {string} compressionType - Sıkıştırma türü (COMPRESSION_OPTIONS)
 * @returns {Uint8Array|string} - Sıkıştırılmış mesaj
 */
const compressMessage = (message, compressionType = COMPRESSION_OPTIONS.GZIP) => {
  // Mesajı string'e dönüştür
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
  
  // Sıkıştırma türüne göre işlem yap
  switch (compressionType) {
    case COMPRESSION_OPTIONS.GZIP:
      return pako.gzip(messageStr);
    case COMPRESSION_OPTIONS.DEFLATE:
      return pako.deflate(messageStr);
    case COMPRESSION_OPTIONS.NONE:
    default:
      return messageStr;
  }
};

/**
 * Sıkıştırılmış mesajı açma
 * @param {Uint8Array|string} compressedMessage - Sıkıştırılmış mesaj
 * @param {string} compressionType - Sıkıştırma türü (COMPRESSION_OPTIONS)
 * @returns {string} - Açılmış mesaj
 */
const decompressMessage = (compressedMessage, compressionType = COMPRESSION_OPTIONS.GZIP) => {
  // Sıkıştırma türüne göre işlem yap
  switch (compressionType) {
    case COMPRESSION_OPTIONS.GZIP:
      return new TextDecoder().decode(pako.ungzip(compressedMessage));
    case COMPRESSION_OPTIONS.DEFLATE:
      return new TextDecoder().decode(pako.inflate(compressedMessage));
    case COMPRESSION_OPTIONS.NONE:
    default:
      return compressedMessage;
  }
};

// WebSocket bağlantı yöneticisi sınıfı
class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 2000, // Yeniden bağlanma aralığı (ms)
      reconnectAttempts: 5, // Maksimum yeniden bağlanma denemesi
      heartbeatInterval: 30000, // Heartbeat aralığı (ms)
      compression: COMPRESSION_OPTIONS.GZIP, // Varsayılan sıkıştırma türü
      ...options,
    };
    
    this.socket = null;
    this.state = CONNECTION_STATES.CLOSED;
    this.reconnectAttempt = 0;
    this.heartbeatTimer = null;
    this.subscriptions = new Map(); // Abonelikler
    this.messageHandlers = new Map(); // Mesaj işleyicileri
    this.pendingMessages = []; // Bağlantı kurulana kadar bekleyen mesajlar
  }
  
  // WebSocket bağlantısını başlatma
  connect() {
    if (this.socket && (this.state === CONNECTION_STATES.OPEN || this.state === CONNECTION_STATES.CONNECTING)) {
      return;
    }
    
    this.state = CONNECTION_STATES.CONNECTING;
    
    try {
      // Sıkıştırma türünü URL'ye ekle
      let wsUrl = this.url;
      if (this.options.compression !== COMPRESSION_OPTIONS.NONE) {
        wsUrl += wsUrl.includes('?') ? '&' : '?';
        wsUrl += `compression=${this.options.compression}`;
      }
      
      this.socket = new WebSocket(wsUrl);
      
      // Binary mesajları kabul et
      this.socket.binaryType = 'arraybuffer';
      
      // Bağlantı açıldığında
      this.socket.onopen = this._handleOpen.bind(this);
      
      // Mesaj alındığında
      this.socket.onmessage = this._handleMessage.bind(this);
      
      // Hata oluştuğunda
      this.socket.onerror = this._handleError.bind(this);
      
      // Bağlantı kapandığında
      this.socket.onclose = this._handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this._reconnect();
    }
  }
  
  // Bağlantıyı kapatma
  disconnect() {
    if (!this.socket) return;
    
    this.state = CONNECTION_STATES.CLOSING;
    
    // Heartbeat'i durdur
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    try {
      this.socket.close();
    } catch (error) {
      console.error('WebSocket close error:', error);
    }
  }
  
  // Mesaj gönderme
  send(message) {
    // Mesajı sıkıştır
    const compressedMessage = this.options.compression !== COMPRESSION_OPTIONS.NONE
      ? compressMessage(message, this.options.compression)
      : typeof message === 'string' ? message : JSON.stringify(message);
    
    if (this.state === CONNECTION_STATES.OPEN && this.socket) {
      try {
        this.socket.send(compressedMessage);
        return true;
      } catch (error) {
        console.error('WebSocket send error:', error);
        return false;
      }
    } else {
      // Bağlantı açık değilse, mesajı bekleyen mesajlara ekle
      this.pendingMessages.push(compressedMessage);
      
      // Bağlantı kapalıysa, yeniden bağlan
      if (this.state === CONNECTION_STATES.CLOSED) {
        this.connect();
      }
      
      return false;
    }
  }
  
  // Kanala abone olma
  subscribe(channel, handler) {
    // Kanal için abonelik listesi yoksa oluştur
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      
      // Sunucuya abone olma mesajı gönder
      const subscribeMessage = {
        method: 'SUBSCRIBE',
        params: [channel],
        id: Date.now(),
      };
      
      this.send(subscribeMessage);
    }
    
    // Handler'ı abonelik listesine ekle
    const handlers = this.subscriptions.get(channel);
    handlers.add(handler);
    
    // Bağlantı kapalıysa, bağlan
    if (this.state === CONNECTION_STATES.CLOSED) {
      this.connect();
    }
    
    // Abonelikten çıkma fonksiyonunu döndür
    return () => {
      this.unsubscribe(channel, handler);
    };
  }
  
  // Kanaldan aboneliği iptal etme
  unsubscribe(channel, handler) {
    if (!this.subscriptions.has(channel)) return;
    
    const handlers = this.subscriptions.get(channel);
    handlers.delete(handler);
    
    // Kanal için başka abone kalmadıysa, sunucuya aboneliği iptal etme mesajı gönder
    if (handlers.size === 0) {
      this.subscriptions.delete(channel);
      
      const unsubscribeMessage = {
        method: 'UNSUBSCRIBE',
        params: [channel],
        id: Date.now(),
      };
      
      this.send(unsubscribeMessage);
    }
  }
  
  // Mesaj işleyici ekleme
  addMessageHandler(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    const handlers = this.messageHandlers.get(type);
    handlers.add(handler);
    
    // Handler'ı kaldırma fonksiyonunu döndür
    return () => {
      this.removeMessageHandler(type, handler);
    };
  }
  
  // Mesaj işleyici kaldırma
  removeMessageHandler(type, handler) {
    if (!this.messageHandlers.has(type)) return;
    
    const handlers = this.messageHandlers.get(type);
    handlers.delete(handler);
    
    if (handlers.size === 0) {
      this.messageHandlers.delete(type);
    }
  }
  
  // Bağlantı açıldığında
  _handleOpen() {
    console.log(`WebSocket connected: ${this.url}`);
    this.state = CONNECTION_STATES.OPEN;
    this.reconnectAttempt = 0;
    
    // Bekleyen mesajları gönder
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      this.socket.send(message);
    }
    
    // Abonelikleri yeniden gönder
    this.subscriptions.forEach((handlers, channel) => {
      const subscribeMessage = {
        method: 'SUBSCRIBE',
        params: [channel],
        id: Date.now(),
      };
      
      this.send(subscribeMessage);
    });
    
    // Heartbeat başlat
    this._startHeartbeat();
  }
  
  // Mesaj alındığında
  _handleMessage(event) {
    try {
      // Mesajı aç
      let messageData = event.data;
      
      // Binary mesaj ise ve sıkıştırma kullanılıyorsa, aç
      if (this.options.compression !== COMPRESSION_OPTIONS.NONE && event.data instanceof ArrayBuffer) {
        messageData = decompressMessage(new Uint8Array(event.data), this.options.compression);
      }
      
      // JSON parse
      const data = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;
      
      // Mesaj türüne göre işleyicileri çağır
      if (data.e && this.messageHandlers.has(data.e)) {
        const handlers = this.messageHandlers.get(data.e);
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`WebSocket message handler error for type ${data.e}:`, error);
          }
        });
      }
      
      // Kanal aboneliklerini kontrol et
      if (data.stream && this.subscriptions.has(data.stream)) {
        const handlers = this.subscriptions.get(data.stream);
        handlers.forEach(handler => {
          try {
            handler(data.data);
          } catch (error) {
            console.error(`WebSocket subscription handler error for channel ${data.stream}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  }
  
  // Hata oluştuğunda
  _handleError(error) {
    console.error('WebSocket error:', error);
  }
  
  // Bağlantı kapandığında
  _handleClose(event) {
    console.log(`WebSocket closed: ${this.url}, code: ${event.code}, reason: ${event.reason}`);
    
    // Heartbeat'i durdur
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    this.state = CONNECTION_STATES.CLOSED;
    
    // Bağlantı normal kapanmadıysa, yeniden bağlan
    if (event.code !== 1000) {
      this._reconnect();
    }
  }
  
  // Yeniden bağlanma
  _reconnect() {
    if (this.state === CONNECTION_STATES.RECONNECTING) return;
    
    this.state = CONNECTION_STATES.RECONNECTING;
    this.reconnectAttempt += 1;
    
    if (this.reconnectAttempt <= this.options.reconnectAttempts) {
      console.log(`WebSocket reconnecting (${this.reconnectAttempt}/${this.options.reconnectAttempts}): ${this.url}`);
      
      setTimeout(() => {
        this.connect();
      }, this.options.reconnectInterval);
    } else {
      console.error(`WebSocket max reconnect attempts reached: ${this.url}`);
    }
  }
  
  // Heartbeat başlatma
  _startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      if (this.state === CONNECTION_STATES.OPEN) {
        // Ping mesajı gönder
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, this.options.heartbeatInterval);
  }
}

// WebSocket bağlantı havuzu
class WebSocketPool {
  constructor() {
    this.connections = new Map();
  }
  
  // Bağlantı alma veya oluşturma
  getConnection(url, options = {}) {
    if (!this.connections.has(url)) {
      const connection = new WebSocketManager(url, options);
      this.connections.set(url, connection);
    }
    
    return this.connections.get(url);
  }
  
  // Tüm bağlantıları kapatma
  closeAll() {
    this.connections.forEach(connection => {
      connection.disconnect();
    });
    
    this.connections.clear();
  }
}

// Singleton WebSocket havuzu
const webSocketPool = new WebSocketPool();

// Piyasa WebSocket bağlantısı
const getMarketWebSocket = (options = {}) => {
  return webSocketPool.getConnection(WS_ENDPOINTS.MARKET, options);
};

// İşlem WebSocket bağlantısı
const getTradingWebSocket = (options = {}) => {
  return webSocketPool.getConnection(WS_ENDPOINTS.TRADING, options);
};

// Bildirim WebSocket bağlantısı
const getNotificationsWebSocket = (options = {}) => {
  return webSocketPool.getConnection(WS_ENDPOINTS.NOTIFICATIONS, options);
};

// Fiyat akışı için hook
const usePriceStream = (symbol, callback) => {
  const ws = getMarketWebSocket();
  
  // Bileşen monte edildiğinde
  React.useEffect(() => {
    // Sembol küçük harfe çevrilir
    const lowerSymbol = symbol.toLowerCase();
    const channel = `${lowerSymbol}@ticker`;
    
    // Kanala abone ol
    const unsubscribe = ws.subscribe(channel, callback);
    
    // Bileşen demonte edildiğinde aboneliği iptal et
    return () => {
      unsubscribe();
    };
  }, [symbol, callback]);
};

// Derinlik akışı için hook
const useDepthStream = (symbol, callback) => {
  const ws = getMarketWebSocket();
  
  // Bileşen monte edildiğinde
  React.useEffect(() => {
    // Sembol küçük harfe çevrilir
    const lowerSymbol = symbol.toLowerCase();
    const channel = `${lowerSymbol}@depth`;
    
    // Kanala abone ol
    const unsubscribe = ws.subscribe(channel, callback);
    
    // Bileşen demonte edildiğinde aboneliği iptal et
    return () => {
      unsubscribe();
    };
  }, [symbol, callback]);
};

// İşlem akışı için hook
const useTradeStream = (symbol, callback) => {
  const ws = getMarketWebSocket();
  
  // Bileşen monte edildiğinde
  React.useEffect(() => {
    // Sembol küçük harfe çevrilir
    const lowerSymbol = symbol.toLowerCase();
    const channel = `${lowerSymbol}@trade`;
    
    // Kanala abone ol
    const unsubscribe = ws.subscribe(channel, callback);
    
    // Bileşen demonte edildiğinde aboneliği iptal et
    return () => {
      unsubscribe();
    };
  }, [symbol, callback]);
};

// Emir güncellemeleri için hook
const useOrderUpdates = (callback) => {
  const ws = getTradingWebSocket();
  
  // Bileşen monte edildiğinde
  React.useEffect(() => {
    // Mesaj türüne göre işleyici ekle
    const removeHandler = ws.addMessageHandler('orderUpdate', callback);
    
    // Bileşen demonte edildiğinde işleyiciyi kaldır
    return () => {
      removeHandler();
    };
  }, [callback]);
};

// Bildirimler için hook
const useNotifications = (callback) => {
  const ws = getNotificationsWebSocket();
  
  // Bileşen monte edildiğinde
  React.useEffect(() => {
    // Mesaj türüne göre işleyici ekle
    const removeHandler = ws.addMessageHandler('notification', callback);
    
    // Bileşen demonte edildiğinde işleyiciyi kaldır
    return () => {
      removeHandler();
    };
  }, [callback]);
};

// Dışa aktarılan API
const websocketService = {
  getMarketWebSocket,
  getTradingWebSocket,
  getNotificationsWebSocket,
  usePriceStream,
  useDepthStream,
  useTradeStream,
  useOrderUpdates,
  useNotifications,
  closeAll: webSocketPool.closeAll.bind(webSocketPool),
  COMPRESSION_OPTIONS,
};

export default websocketService; 