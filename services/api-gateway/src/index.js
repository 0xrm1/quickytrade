require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const { ApolloServer } = require('apollo-server-express');
const http = require('http');
const WebSocket = require('ws');
const { createClient } = require('redis');

const logger = require('./utils/logger');
const { typeDefs, resolvers } = require('./graphql');
const { verifyToken } = require('./middleware/authMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const setupWebSocketProxy = require('./websocket/wsProxy');

// Initialize Express app
const app = express();
const PORT = process.env.API_GATEWAY_PORT || 5000;

// Initialize Redis client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_PASSWORD ? process.env.REDIS_PASSWORD + '@' : ''}${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.connect().then(() => {
  logger.info('Connected to Redis');
}).catch((err) => {
  logger.error('Redis connection error:', err);
});

// Apply middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Apply rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

// Setup Apollo Server for GraphQL
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Get the user token from the headers
    const token = req.headers.authorization || '';
    // Try to retrieve a user with the token
    const user = verifyToken(token.replace('Bearer ', ''));
    // Add the user to the context
    return { user, redisClient };
  },
});

// Apply proxy middleware for Auth Service
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth',
  },
  logLevel: 'warn',
  onError: (err, req, res) => {
    logger.error(`Auth Service Proxy Error: ${err.message}`);
    res.status(500).json({ error: 'Auth service unavailable' });
  }
}));

// Apply proxy middleware for Users Service (part of Auth Service)
app.use('/api/users', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users',
  },
  logLevel: 'warn',
  onError: (err, req, res) => {
    logger.error(`Users Service Proxy Error: ${err.message}`);
    res.status(500).json({ error: 'Users service unavailable' });
  }
}));

// Apply proxy middleware for Binance API Service
app.use('/api/binance', createProxyMiddleware({
  target: process.env.BINANCE_API_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/binance': '/api/binance',
  },
  logLevel: 'warn',
  onError: (err, req, res) => {
    logger.error(`Binance API Service Proxy Error: ${err.message}`);
    res.status(500).json({ error: 'Binance API service unavailable' });
  }
}));

// Error handling middleware
app.use(errorMiddleware);

// Start the Apollo Server
async function startApolloServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });
  logger.info(`GraphQL server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`);
}

startApolloServer().catch(err => {
  logger.error('Failed to start Apollo Server:', err);
});

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Setup WebSocket proxy
setupWebSocketProxy(wss, redisClient);

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start the server
server.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = { app, server }; 