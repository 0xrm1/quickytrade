const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        binance_api_key TEXT,
        binance_secret_key TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error.stack);
  }
};

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Connected to the database successfully');
    // Initialize database tables after successful connection
    initializeDatabase();
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initializeDatabase
}; 