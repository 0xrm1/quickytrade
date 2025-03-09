-- Drop table if exists
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hash
  binance_api_key TEXT,            -- encrypted
  binance_secret_key TEXT,         -- encrypted
  created_at TIMESTAMP DEFAULT NOW()
); 