const { GraphQLJSON } = require('graphql-type-json');
const axios = require('axios');
const logger = require('../utils/logger');

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}, context) => {
  try {
    const headers = {
      ...options.headers,
      ...(context.user ? { Authorization: `Bearer ${context.user.token}` } : {})
    };

    const response = await axios({
      ...options,
      url,
      headers
    });

    return response.data;
  } catch (error) {
    logger.error('API request error:', error.message);
    throw new Error(error.response?.data?.error?.message || 'API request failed');
  }
};

const resolvers = {
  // Custom scalar for JSON data
  JSON: GraphQLJSON,

  Query: {
    // User queries
    me: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const response = await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/auth/me`,
        { method: 'GET' },
        context
      );

      return response.data.user;
    },

    user: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const response = await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/users/${id}`,
        { method: 'GET' },
        context
      );

      return response.data.user;
    },

    users: async (_, { page = 1, limit = 10, role, search }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(role && { role }),
        ...(search && { search })
      });

      const response = await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/users?${queryParams}`,
        { method: 'GET' },
        context
      );

      return {
        users: response.data.users,
        count: response.count,
        total: response.total,
        page: response.pagination.page,
        pages: response.pagination.pages
      };
    },

    // Market data queries
    symbols: async () => {
      const response = await makeAuthenticatedRequest(
        `${process.env.BINANCE_API_SERVICE_URL}/api/binance/market/symbols`,
        { method: 'GET' }
      );

      return response.data.symbols;
    },

    symbol: async (_, { symbol }) => {
      const response = await makeAuthenticatedRequest(
        `${process.env.BINANCE_API_SERVICE_URL}/api/binance/market/symbol/${symbol}`,
        { method: 'GET' }
      );

      return response.data.symbol;
    },

    tickerPrice: async (_, { symbol }) => {
      const url = symbol
        ? `${process.env.BINANCE_API_SERVICE_URL}/api/binance/ticker/price/${symbol}`
        : `${process.env.BINANCE_API_SERVICE_URL}/api/binance/ticker/price`;

      const response = await makeAuthenticatedRequest(url, { method: 'GET' });

      return Array.isArray(response.data) ? response.data : [response.data];
    },

    ticker24hr: async (_, { symbol }) => {
      const url = symbol
        ? `${process.env.BINANCE_API_SERVICE_URL}/api/binance/ticker/24hr/${symbol}`
        : `${process.env.BINANCE_API_SERVICE_URL}/api/binance/ticker/24hr`;

      const response = await makeAuthenticatedRequest(url, { method: 'GET' });

      return Array.isArray(response.data) ? response.data : [response.data];
    },

    klines: async (_, { symbol, interval, limit }) => {
      const queryParams = new URLSearchParams({
        interval,
        ...(limit && { limit: limit.toString() })
      });

      const response = await makeAuthenticatedRequest(
        `${process.env.BINANCE_API_SERVICE_URL}/api/binance/kline/${symbol}?${queryParams}`,
        { method: 'GET' }
      );

      return response.data.klines;
    },

    orderBook: async (_, { symbol, limit }) => {
      const queryParams = new URLSearchParams({
        ...(limit && { limit: limit.toString() })
      });

      const response = await makeAuthenticatedRequest(
        `${process.env.BINANCE_API_SERVICE_URL}/api/binance/depth/${symbol}?${queryParams}`,
        { method: 'GET' }
      );

      return response.data.orderBook;
    },

    trades: async (_, { symbol, limit }) => {
      const queryParams = new URLSearchParams({
        ...(limit && { limit: limit.toString() })
      });

      const response = await makeAuthenticatedRequest(
        `${process.env.BINANCE_API_SERVICE_URL}/api/binance/trade/${symbol}?${queryParams}`,
        { method: 'GET' }
      );

      return response.data.trades;
    }
  },

  Mutation: {
    // Auth mutations
    register: async (_, { input }) => {
      const response = await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/auth/register`,
        {
          method: 'POST',
          data: input
        }
      );

      return response.data.user;
    },

    login: async (_, { input }) => {
      const response = await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/auth/login`,
        {
          method: 'POST',
          data: input
        }
      );

      return {
        user: response.data.user,
        tokens: response.data.tokens
      };
    },

    refreshToken: async (_, { refreshToken }) => {
      const response = await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/auth/refresh-token`,
        {
          method: 'POST',
          data: { refreshToken }
        }
      );

      return response.data.tokens;
    },

    logout: async (_, { refreshToken }, context) => {
      await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/auth/logout`,
        {
          method: 'POST',
          data: { refreshToken }
        },
        context
      );

      return true;
    },

    changePassword: async (_, { input }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/auth/change-password`,
        {
          method: 'PUT',
          data: input
        },
        context
      );

      return true;
    },

    forgotPassword: async (_, { email }) => {
      await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/auth/forgot-password`,
        {
          method: 'POST',
          data: { email }
        }
      );

      return true;
    },

    resetPassword: async (_, { token, password }) => {
      await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/auth/reset-password/${token}`,
        {
          method: 'POST',
          data: { password }
        }
      );

      return true;
    },

    // User mutations
    updateUser: async (_, { id, input }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const response = await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/users/${id}`,
        {
          method: 'PUT',
          data: input
        },
        context
      );

      return response.data.user;
    },

    updatePreferences: async (_, { input }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const response = await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/users/${context.user.id}/preferences`,
        {
          method: 'PATCH',
          data: { preferences: input }
        },
        context
      );

      return response.data.user;
    },

    deleteUser: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/users/${id}`,
        { method: 'DELETE' },
        context
      );

      return true;
    },

    revokeAllSessions: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      await makeAuthenticatedRequest(
        `${process.env.AUTH_SERVICE_URL}/api/users/${context.user.id}/revoke-sessions`,
        { method: 'POST' },
        context
      );

      return true;
    }
  },

  Subscription: {
    tickerUpdated: {
      subscribe: (_, { symbol }, { pubsub }) => {
        const channel = `TICKER_${symbol.toUpperCase()}`;
        return pubsub.asyncIterator([channel]);
      }
    },

    klineUpdated: {
      subscribe: (_, { symbol, interval }, { pubsub }) => {
        const channel = `KLINE_${symbol.toUpperCase()}_${interval}`;
        return pubsub.asyncIterator([channel]);
      }
    },

    orderBookUpdated: {
      subscribe: (_, { symbol }, { pubsub }) => {
        const channel = `ORDERBOOK_${symbol.toUpperCase()}`;
        return pubsub.asyncIterator([channel]);
      }
    },

    tradeExecuted: {
      subscribe: (_, { symbol }, { pubsub }) => {
        const channel = `TRADE_${symbol.toUpperCase()}`;
        return pubsub.asyncIterator([channel]);
      }
    }
  }
};

module.exports = resolvers; 