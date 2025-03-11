# QuickyTrade Auth Mikroservisi

Bu mikroservis, QuickyTrade platformunun kimlik doğrulama ve kullanıcı yönetimi işlemlerini yönetir.

## Özellikler

- JWT tabanlı kimlik doğrulama
- Kullanıcı kaydı ve yönetimi
- Rol tabanlı yetkilendirme
- Şifre sıfırlama
- E-posta doğrulama
- Oturum yönetimi
- Redis önbelleği

## Teknoloji Yığını

- Node.js
- Express.js
- MongoDB (Mongoose)
- Redis
- JWT (JSON Web Tokens)
- bcryptjs

## Kurulum

### Gereksinimler

- Node.js 14+
- MongoDB
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
AUTH_SERVICE_PORT=5002

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/quickytrade
MONGODB_URI_TEST=mongodb://localhost:27017/quickytrade_test

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your_encryption_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15*60*1000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

3. Uygulamayı başlatın:

```bash
# Geliştirme modunda
npm run dev

# Üretim modunda
npm start
```

## API Endpoints

### Kimlik Doğrulama

- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/refresh-token` - Access token yenileme
- `POST /api/auth/logout` - Kullanıcı çıkışı
- `GET /api/auth/verify-email/:token` - E-posta doğrulama
- `POST /api/auth/forgot-password` - Şifre sıfırlama isteği
- `POST /api/auth/reset-password/:token` - Şifre sıfırlama
- `GET /api/auth/me` - Mevcut kullanıcı bilgilerini alma
- `PUT /api/auth/change-password` - Şifre değiştirme

### Kullanıcı Yönetimi

- `GET /api/users` - Tüm kullanıcıları listeleme (admin)
- `GET /api/users/:id` - Kullanıcı detaylarını alma
- `PUT /api/users/:id` - Kullanıcı bilgilerini güncelleme
- `DELETE /api/users/:id` - Kullanıcı silme
- `PATCH /api/users/:id/preferences` - Kullanıcı tercihlerini güncelleme
- `GET /api/users/:id/activity` - Kullanıcı aktivitelerini görüntüleme
- `POST /api/users/:id/revoke-sessions` - Tüm oturumları sonlandırma

## Veri Modelleri

### Kullanıcı Modeli

```javascript
{
  username: String,
  email: String,
  password: String,
  role: String,
  isEmailVerified: Boolean,
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  preferences: {
    theme: String,
    notifications: {
      email: Boolean,
      push: Boolean
    },
    defaultCurrency: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Token Modeli

```javascript
{
  userId: ObjectId,
  token: String,
  type: String,
  expiresAt: Date,
  isRevoked: Boolean,
  createdAt: Date,
  userAgent: String,
  ipAddress: String
}
```

## Docker ile Çalıştırma

```bash
# Docker imajı oluşturma
docker build -t quickytrade-auth-service .

# Docker konteynerini çalıştırma
docker run -p 5002:5002 --env-file .env quickytrade-auth-service
```

## Test

```bash
npm test
```

## Lisans

MIT 