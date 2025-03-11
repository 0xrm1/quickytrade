# QuickyTrade Auth Mikroservisi

Bu mikroservis, QuickyTrade platformunun kimlik doğrulama ve kullanıcı yönetimi işlevlerini sağlar.

## Özellikler

- Kullanıcı kaydı ve girişi
- JWT tabanlı kimlik doğrulama
- Kullanıcı profili yönetimi
- API anahtarları yönetimi
- Şifre sıfırlama
- E-posta doğrulama
- Rol tabanlı yetkilendirme

## Teknoloji Yığını

- Node.js
- Express.js
- MongoDB / PostgreSQL
- JWT
- bcrypt

## Kurulum

### Gereksinimler

- Node.js 14+
- MongoDB veya PostgreSQL

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
AUTH_PORT=5002

# Database Configuration
# Choose database type: 'mongodb' or 'postgresql'
DB_TYPE=postgresql

# PostgreSQL Configuration
DATABASE_URL=postgres://username:password@localhost:5432/database_name

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/database_name

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=30d

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@quickytrade.com
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
- `POST /api/auth/forgot-password` - Şifre sıfırlama isteği
- `POST /api/auth/reset-password/:resetToken` - Şifre sıfırlama
- `GET /api/auth/verify-email/:verificationToken` - E-posta doğrulama

### Kullanıcı Yönetimi

- `GET /api/auth/profile` - Kullanıcı profili alma
- `PUT /api/auth/profile` - Kullanıcı profili güncelleme
- `PUT /api/auth/api-keys` - API anahtarlarını güncelleme
- `GET /api/auth/api-keys` - API anahtarlarını alma
- `GET /api/auth/users` - Tüm kullanıcıları alma (sadece admin)

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