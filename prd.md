# OrionTrade Platform User System Requirements Document

## Technical Stack
- [x] Frontend: React (TypeScript recommended)
- [x] Backend: Node.js/Express.js
- [x] Database: PostgreSQL (Hosted on Render.com)
- [x] Encryption: crypto-js (AES) + bcrypt

## Core Features

### 1. User Registration
- [x] `/register` endpoint (POST)
  - [x] Email validation (format + uniqueness)
  - [x] Password hashing with bcrypt (min 8 chars)
  - [x] Optional: Binance API key encryption
- [x] React Registration Form
  - [x] Email & password inputs
  - [x] Form validation
  - [x] Success/error handling

### 2. User Authentication
- [x] `/login` endpoint (POST)
  - [x] Email/password verification
  - [x] JWT token generation (expiry: 1h)
- [x] React Login Form
  - [x] Token storage (localStorage/sessionStorage)
  - [x] Auth context/provider
  - [x] Protected routes

### 3. Profile Management
- [x] `PUT /user/api-keys` endpoint
  - [x] AES encryption for API keys
  - [x] Master key via ENCRYPTION_KEY env
- [x] React Profile Page
  - [x] API key input form
  - [x] Encrypted data display
  - [x] Update mechanism

### 4. Database Structure
```sql
-- users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hash
  binance_api_key TEXT,            -- encrypted
  binance_secret_key TEXT,         -- encrypted
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Security Requirements
- [x] Environment variables setup on Render:
  - [x] DATABASE_URL
  - [x] JWT_SECRET
  - [x] ENCRYPTION_KEY
- [x] AES encryption for Binance keys
- [x] HTTPS enforcement
- [x] CORS configuration

## Implementation Checklist

### Backend (Node.js)
- [x] Set up Express.js routes
- [x] Implement password hashing
- [x] JWT authentication middleware
- [x] API key encryption/decryption service
- [x] Error handling (English messages)

### Frontend (React)
- [x] Auth forms (Register/Login)
- [x] Profile settings page
- [x] API key management UI
- [x] HTTP client (axios/fetch)
- [x] Token handling in requests

### Deployment
- [x] PostgreSQL setup on Render
- [x] Environment variables configuration
- [x] Build & deployment scripts
- [x] Health check endpoints

---

**Not:** Tüm hata mesajları ve kullanıcı geri bildirimleri İngilizce olacak şekilde ayarlanmalıdır. Kullanıcı dostu mesajlar için i18n kütüphanesi önerilir. 