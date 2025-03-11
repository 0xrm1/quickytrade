# QuickyTrade API Gateway

Bu mikroservis, QuickyTrade platformunun API Gateway'ini oluşturur. Tüm istemci isteklerini ilgili mikroservislere yönlendirir ve GraphQL API'sini sağlar.

## Özellikler

- REST API proxy
- GraphQL API
- WebSocket proxy
- JWT doğrulama
- Rate limiting
- CORS yapılandırması
- Redis önbelleği
- Hata yönetimi
- Loglama

## Teknoloji Yığını

- Node.js
- Express.js
- Apollo Server (GraphQL)
- WebSocket (ws)
- Redis
- JWT

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
API_GATEWAY_PORT=5000

# Service URLs
AUTH_SERVICE_URL=http://localhost:5002
BINANCE_API_SERVICE_URL=http://localhost:5001

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15*60*1000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000
```

3. Uygulamayı başlatın:

```bash
# Geliştirme modunda
npm run dev

# Üretim modunda
npm start
```

## API Endpoints

### REST API Proxy

- `POST /api/auth/*` - Auth Service endpoints
- `GET /api/users/*` - User Service endpoints
- `GET /api/binance/*` - Binance API Service endpoints

### GraphQL API

- `/graphql` - GraphQL endpoint

### WebSocket

- `/ws` - WebSocket endpoint

## GraphQL Şeması

### Queries

```graphql
type Query {
  # User queries
  me: User
  user(id: ID!): User
  users(page: Int, limit: Int, role: String, search: String): UserPagination

  # Market data queries
  symbols: [Symbol!]!
  symbol(symbol: String!): Symbol
  tickerPrice(symbol: String): [TickerPrice!]!
  ticker24hr(symbol: String): [Ticker24hr!]!
  klines(symbol: String!, interval: String!, limit: Int): [Kline!]!
  orderBook(symbol: String!, limit: Int): OrderBook
  trades(symbol: String!, limit: Int): [Trade!]!
}
```

### Mutations

```graphql
type Mutation {
  # Auth mutations
  register(input: RegisterInput!): User!
  login(input: LoginInput!): AuthPayload!
  refreshToken(refreshToken: String!): Tokens!
  logout(refreshToken: String!): Boolean!
  changePassword(input: ChangePasswordInput!): Boolean!
  forgotPassword(email: String!): Boolean!
  resetPassword(token: String!, password: String!): Boolean!
  
  # User mutations
  updateUser(id: ID!, input: UpdateUserInput!): User!
  updatePreferences(input: PreferencesInput!): User!
  deleteUser(id: ID!): Boolean!
  revokeAllSessions: Boolean!
}
```

### Subscriptions

```graphql
type Subscription {
  tickerUpdated(symbol: String!): TickerPrice!
  klineUpdated(symbol: String!, interval: String!): Kline!
  orderBookUpdated(symbol: String!): OrderBook!
  tradeExecuted(symbol: String!): Trade!
}
```

## WebSocket Kullanımı

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

// Bağlantı
ws.onopen = () => {
  console.log('Connected to WebSocket server');
  
  // Kimlik doğrulama
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your_jwt_token'
  }));
};

// Akışlara abone olma
ws.send(JSON.stringify({
  method: 'SUBSCRIBE',
  params: ['btcusdt@ticker', 'ethusdt@kline_1m'],
  id: 1
}));

// Mesajları alma
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received data:', data);
};

// Abonelikten çıkma
ws.send(JSON.stringify({
  method: 'UNSUBSCRIBE',
  params: ['btcusdt@ticker'],
  id: 2
}));

// Bağlantı kapanma
ws.onclose = () => {
  console.log('Disconnected from WebSocket server');
};
```

## Docker ile Çalıştırma

```bash
# Docker imajı oluşturma
docker build -t quickytrade-api-gateway .

# Docker konteynerini çalıştırma
docker run -p 5000:5000 --env-file .env quickytrade-api-gateway
```

## Test

```bash
npm test
```

## Lisans

MIT 