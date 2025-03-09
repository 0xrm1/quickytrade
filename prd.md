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
- [x] Watchlist Component
  - [x] Display favorite trading pairs
  - [x] Real-time price updates
  - [x] Add/remove symbols
- [x] Positions Component
  - [x] Current open positions
  - [x] Position details (entry, size, PnL)
  - [x] Close position functionality
- [x] Terminal Component
  - [x] Command-line interface
  - [x] Order execution
  - [x] Command history
- [x] News Component
  - [x] Crypto news feed
  - [x] Filtering by asset
  - [x] News impact indicators
- [x] SolanaDEX Component
  - [x] Solana token swaps
  - [x] Liquidity pools information
  - [x] Transaction history
- [x] QuickButtonBar Component
  - [x] Shortcut buttons for common actions
  - [x] Customizable button configuration
  - [x] Action execution

### 5. Backend Routes
- [x] Positions Routes
  - [x] GET `/api/positions` - Get all positions
  - [x] POST `/api/positions/close` - Close position
  - [x] POST `/api/positions/close-partial` - Close partial position
- [x] Watchlist Routes
  - [x] GET `/api/watchlist` - Get user watchlist
  - [x] POST `/api/watchlist` - Add symbol to watchlist
  - [x] DELETE `/api/watchlist/:symbol` - Remove from watchlist
- [x] Terminal Routes
  - [x] POST `/api/terminal/execute` - Execute terminal command
  - [x] GET `/api/terminal/history` - Get command history
  - [x] POST `/api/terminal/history` - Add to command history
- [x] QuickButton Routes
  - [x] GET `/api/quick-buttons` - Get user's quick buttons
  - [x] POST `/api/quick-buttons/add` - Create quick button
  - [x] DELETE `/api/quick-buttons/remove/:id` - Delete quick button
  - [x] POST `/api/quick-buttons/sync` - Sync quick buttons

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
- [x] Integrate positions routes
- [x] Integrate watchlist routes
- [x] Integrate terminal routes
- [x] Integrate quick button routes
- [ ] Update server and app configuration

### Frontend (React)
- [x] Auth forms (Register/Login)
- [x] Profile settings page
- [x] API key management UI
- [x] HTTP client (axios/fetch)
- [x] Token handling in requests
- [x] Dashboard layout implementation
- [x] Watchlist component integration
- [x] Positions component integration
- [x] Terminal component integration
- [x] News component integration
- [x] SolanaDEX component integration
- [x] QuickButtonBar component integration
- [x] Update app routing and navigation

### Deployment
- [x] PostgreSQL setup on Render
- [x] Environment variables configuration
- [x] Build & deployment scripts
- [x] Health check endpoints
- [x] Update deployment configuration for new components

---

**Not:** Tüm hata mesajları ve kullanıcı geri bildirimleri İngilizce olacak şekilde ayarlanmalıdır. Kullanıcı dostu mesajlar için i18n kütüphanesi önerilir. 