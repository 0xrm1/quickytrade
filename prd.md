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

### 4. Dashboard Components
- [x] Dashboard Layout
  - [x] Main dashboard container
  - [x] Responsive grid layout
  - [x] Navigation and header
- [ ] Watchlist Component
  - [ ] Display favorite trading pairs
  - [ ] Real-time price updates
  - [ ] Add/remove symbols
- [ ] Positions Component
  - [ ] Current open positions
  - [ ] Position details (entry, size, PnL)
  - [ ] Close position functionality
- [ ] Terminal Component
  - [ ] Trading chart integration
  - [ ] Order entry form
  - [ ] Order history
- [ ] News Component
  - [ ] Crypto news feed
  - [ ] Filtering by asset
  - [ ] News impact indicators
- [ ] SolanaDEX Component
  - [ ] Solana token swaps
  - [ ] Liquidity pools information
  - [ ] Transaction history
- [ ] QuickButtonBar Component
  - [ ] Shortcut buttons for common actions
  - [ ] Customizable button configuration
  - [ ] Action execution

### 5. Backend Routes
- [ ] Positions Routes
  - [ ] GET `/api/positions` - Get all positions
  - [ ] GET `/api/positions/:id` - Get position by ID
  - [ ] POST `/api/positions` - Create new position
  - [ ] PUT `/api/positions/:id` - Update position
  - [ ] DELETE `/api/positions/:id` - Close position
- [ ] Watchlist Routes
  - [ ] GET `/api/watchlist` - Get user watchlist
  - [ ] POST `/api/watchlist` - Add symbol to watchlist
  - [ ] DELETE `/api/watchlist/:symbol` - Remove from watchlist
- [ ] Terminal Routes
  - [ ] GET `/api/market-data/:symbol` - Get market data
  - [ ] POST `/api/orders` - Place new order
  - [ ] GET `/api/orders` - Get order history
- [ ] QuickButton Routes
  - [ ] GET `/api/quick-buttons` - Get user's quick buttons
  - [ ] POST `/api/quick-buttons` - Create quick button
  - [ ] PUT `/api/quick-buttons/:id` - Update quick button
  - [ ] DELETE `/api/quick-buttons/:id` - Delete quick button

### 6. Database Structure
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

-- Additional tables to be added:
-- watchlist table
-- positions table
-- orders table
-- quick_buttons table
```

### 7. Security Requirements
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
- [ ] Integrate positions routes
- [ ] Integrate watchlist routes
- [ ] Integrate terminal routes
- [ ] Integrate quick button routes
- [ ] Update server and app configuration

### Frontend (React)
- [x] Auth forms (Register/Login)
- [x] Profile settings page
- [x] API key management UI
- [x] HTTP client (axios/fetch)
- [x] Token handling in requests
- [x] Dashboard layout implementation
- [ ] Watchlist component integration
- [ ] Positions component integration
- [ ] Terminal component integration
- [ ] News component integration
- [ ] SolanaDEX component integration
- [ ] QuickButtonBar component integration
- [x] Update app routing and navigation

### Deployment
- [x] PostgreSQL setup on Render
- [x] Environment variables configuration
- [x] Build & deployment scripts
- [x] Health check endpoints
- [ ] Update deployment configuration for new components

---

**Not:** Tüm hata mesajları ve kullanıcı geri bildirimleri İngilizce olacak şekilde ayarlanmalıdır. Kullanıcı dostu mesajlar için i18n kütüphanesi önerilir. 