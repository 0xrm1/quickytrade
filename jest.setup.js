// Load environment variables
require('dotenv').config();

// Mock Redis client
jest.mock('redis', () => {
  const redisMock = {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
    isOpen: false,
  };

  return {
    createClient: jest.fn().mockReturnValue(redisMock),
  };
});

// Mock WebSocket
jest.mock('ws', () => {
  class WebSocketServer {
    constructor() {
      this.clients = new Set();
      this.on = jest.fn();
      this.close = jest.fn();
    }

    handleUpgrade(request, socket, head, callback) {
      callback(this);
    }
  }

  class WebSocket {
    constructor() {
      this.send = jest.fn();
      this.close = jest.fn();
      this.on = jest.fn();
      this.readyState = 1;
    }
  }

  WebSocket.CONNECTING = 0;
  WebSocket.OPEN = 1;
  WebSocket.CLOSING = 2;
  WebSocket.CLOSED = 3;

  return {
    WebSocketServer,
    WebSocket,
  };
});

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ id: 'user-id', role: 'user' }),
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  }),
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
}));

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock process.env
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  JWT_SECRET: 'test-jwt-secret',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
  ENCRYPTION_KEY: 'test-encryption-key',
};

// Global test timeout
jest.setTimeout(10000); 