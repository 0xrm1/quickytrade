# QuickyTrade Binance API Mikroservisi

Bu mikroservis, QuickyTrade platformunun Binance API entegrasyonunu ve WebSocket bağlantılarını yönetir.

## Özellikler

- Binance REST API entegrasyonu
- WebSocket bağlantı paylaşımı
- Threshold-based güncellemeler
- Redis önbelleği
- WebSocket sunucusu

## Teknoloji Yığını

- Node.js
- Express.js
- Redis
- WebSocket (ws)
- node-binance-api

## Kurulum

### Gereksinimler

- Node.js 14+
- Redis

### Adımlar

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. `.env` dosyasını yapılandırın:

```
# Node Environment
NODE_ENV=development

# Server Configuration
BINANCE_API_PORT=5001

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Binance API Configuration
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret

# WebSocket Configuration
PRICE_CHANGE_THRESHOLD=0.1
VOLUME_CHANGE_THRESHOLD=1.0

# JWT Configuration (for authentication)
JWT_SECRET=your_jwt_secret_key_here
```

3. Uygulamayı başlatın:

```bash
# Geliştirme modunda
npm run dev

# Üretim modunda
npm start
```

## API Endpoints

### Market Verileri

- `GET /api/binance/market/exchange-info` - Borsa bilgilerini al
- `GET /api/binance/market/symbols` - Tüm sembolleri al
- `GET /api/binance/market/symbol/:symbol` - Sembol detaylarını al
- `GET /api/binance/market/assets` - Tüm varlıkları al

### Ticker Verileri

- `GET /api/binance/ticker/price` - Tüm sembollerin fiyatlarını al
- `GET /api/binance/ticker/price/:symbol` - Belirli bir sembolün fiyatını al
- `GET /api/binance/ticker/24hr` - Tüm sembollerin 24 saatlik verilerini al
- `GET /api/binance/ticker/24hr/:symbol` - Belirli bir sembolün 24 saatlik verilerini al

### Kline (Mum) Verileri

- `GET /api/binance/kline/:symbol` - Belirli bir sembolün mum verilerini al
- `GET /api/binance/kline/:symbol/:interval` - Belirli bir sembolün belirli bir aralıktaki mum verilerini al

### Derinlik (Emir Defteri) Verileri

- `GET /api/binance/depth/:symbol` - Belirli bir sembolün emir defterini al
- `GET /api/binance/depth/:symbol/:limit` - Belirli bir sembolün belirli bir limitle emir defterini al

### İşlem Verileri

- `GET /api/binance/trade/:symbol` - Belirli bir sembolün son işlemlerini al
- `GET /api/binance/trade/:symbol/:limit` - Belirli bir sembolün belirli bir limitle son işlemlerini al

### WebSocket

- `GET /api/binance/ws/status` - WebSocket sunucusu durumunu al
- `POST /api/binance/ws/subscribe` - Akışlara abone ol
- `POST /api/binance/ws/unsubscribe` - Akışlardan aboneliği kaldır

## WebSocket Kullanımı

WebSocket sunucusuna bağlanmak için:

```javascript
const ws = new WebSocket('ws://localhost:5001/ws');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
  
  // Akışlara abone ol
  ws.send(JSON.stringify({
    method: 'SUBSCRIBE',
    params: ['btcusdt@ticker', 'ethusdt@kline_1m'],
    id: 1
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received data:', data);
};

ws.onclose = () => {
  console.log('Disconnected from WebSocket server');
};

// Akışlardan aboneliği kaldır
ws.send(JSON.stringify({
  method: 'UNSUBSCRIBE',
  params: ['btcusdt@ticker'],
  id: 2
}));
```

## Docker ile Çalıştırma

```bash
# Docker imajı oluşturma
docker build -t quickytrade-binance-api-service .

# Docker konteynerini çalıştırma
docker run -p 5001:5001 --env-file .env quickytrade-binance-api-service
```

## Test

```bash
npm test
```

## Lisans

MIT 