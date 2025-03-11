const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const marketRoutes = require('./routes/marketRoutes');
const tickerRoutes = require('./routes/tickerRoutes');
const klineRoutes = require('./routes/klineRoutes');
const depthRoutes = require('./routes/depthRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const websocketRoutes = require('./routes/websocketRoutes');
const { connectRedis } = require('./config/redis');
const { errorHandler } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.BINANCE_API_PORT || 5001;

// Connect to Redis
connectRedis();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/binance', limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/binance/market', marketRoutes);
app.use('/api/binance/ticker', tickerRoutes);
app.use('/api/binance/kline', klineRoutes);
app.use('/api/binance/depth', depthRoutes);
app.use('/api/binance/trade', tradeRoutes);
app.use('/api/binance/ws', websocketRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Binance API service is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Binance API service running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});

module.exports = app; 