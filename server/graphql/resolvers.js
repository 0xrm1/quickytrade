/**
 * GraphQL Çözücüleri
 * 
 * Bu dosya, GraphQL şemasında tanımlanan sorgular, mutasyonlar ve abonelikler için
 * çözücü fonksiyonları içerir. Bu çözücüler, istemci tarafından yapılan GraphQL
 * isteklerini işler ve ilgili verileri döndürür.
 */

const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { GraphQLScalarType, Kind } = require('graphql');

// PubSub örneği oluştur
const pubsub = new PubSub();

// Abone olma olayları
const TICKER_UPDATED = 'TICKER_UPDATED';
const DEPTH_UPDATED = 'DEPTH_UPDATED';
const TRADES_UPDATED = 'TRADES_UPDATED';

// Skaler tip tanımlamaları
const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value instanceof Date ? value.getTime() : value;
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    return null;
  },
});

const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
        return JSON.parse(ast.value);
      case Kind.OBJECT:
        return ast.fields.reduce((obj, field) => {
          obj[field.name.value] = field.value.value;
          return obj;
        }, {});
      default:
        return null;
    }
  },
});

// Servis URL'leri
const BINANCE_API_URL = process.env.BINANCE_API_URL || 'http://localhost:5001/api';
const AUTH_API_URL = process.env.AUTH_API_URL || 'http://localhost:5002/api';

// Yardımcı fonksiyonlar
const getAuthToken = (context) => {
  const authHeader = context.req.headers.authorization;
  if (!authHeader) {
    throw new AuthenticationError('Kimlik doğrulama başlığı bulunamadı');
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AuthenticationError('Geçersiz token formatı');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { token, userId: decoded.userId };
  } catch (error) {
    throw new AuthenticationError('Geçersiz veya süresi dolmuş token');
  }
};

// Çözücüler
const resolvers = {
  // Skaler tipler
  Date: dateScalar,
  JSON: jsonScalar,
  
  // Sorgular
  Query: {
    // Kullanıcı sorguları
    me: async (_, __, context) => {
      try {
        const { token } = getAuthToken(context);
        const response = await axios.get(`${AUTH_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        throw new AuthenticationError('Kullanıcı bilgileri alınamadı');
      }
    },
    
    user: async (_, { id }, context) => {
      try {
        const { token } = getAuthToken(context);
        const response = await axios.get(`${AUTH_API_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        throw new UserInputError('Kullanıcı bulunamadı');
      }
    },
    
    // Piyasa verileri sorguları
    ticker: async (_, { symbol }) => {
      try {
        const response = await axios.get(`${BINANCE_API_URL}/ticker?symbol=${symbol}`);
        return response.data;
      } catch (error) {
        throw new UserInputError('Ticker verisi alınamadı');
      }
    },
    
    tickers: async (_, { symbols }) => {
      try {
        const symbolsParam = symbols ? symbols.join(',') : '';
        const response = await axios.get(`${BINANCE_API_URL}/tickers?symbols=${symbolsParam}`);
        return response.data;
      } catch (error) {
        throw new UserInputError('Ticker verileri alınamadı');
      }
    },
    
    klines: async (_, { symbol, interval, limit }) => {
      try {
        const limitParam = limit ? `&limit=${limit}` : '';
        const response = await axios.get(`${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}${limitParam}`);
        return response.data;
      } catch (error) {
        throw new UserInputError('Kline verileri alınamadı');
      }
    },
    
    depth: async (_, { symbol, limit }) => {
      try {
        const limitParam = limit ? `&limit=${limit}` : '';
        const response = await axios.get(`${BINANCE_API_URL}/depth?symbol=${symbol}${limitParam}`);
        return response.data;
      } catch (error) {
        throw new UserInputError('Derinlik verisi alınamadı');
      }
    },
    
    trades: async (_, { symbol, limit }) => {
      try {
        const limitParam = limit ? `&limit=${limit}` : '';
        const response = await axios.get(`${BINANCE_API_URL}/trades?symbol=${symbol}${limitParam}`);
        return response.data;
      } catch (error) {
        throw new UserInputError('İşlem verileri alınamadı');
      }
    },
    
    exchangeInfo: async () => {
      try {
        const response = await axios.get(`${BINANCE_API_URL}/exchangeInfo`);
        return response.data;
      } catch (error) {
        throw new UserInputError('Borsa bilgisi alınamadı');
      }
    },
    
    // Önbellek sorguları
    cacheStatus: async () => {
      try {
        const response = await axios.get(`${BINANCE_API_URL}/cache/status`);
        return response.data;
      } catch (error) {
        throw new UserInputError('Önbellek durumu alınamadı');
      }
    },
    
    thresholds: async () => {
      try {
        const response = await axios.get(`${BINANCE_API_URL}/thresholds`);
        return response.data;
      } catch (error) {
        throw new UserInputError('Eşik değerleri alınamadı');
      }
    },
  },
  
  // Mutasyonlar
  Mutation: {
    // Kimlik doğrulama mutasyonları
    register: async (_, { email, password, username }) => {
      try {
        const response = await axios.post(`${AUTH_API_URL}/auth/register`, {
          email,
          password,
          username
        });
        return response.data;
      } catch (error) {
        throw new UserInputError('Kayıt işlemi başarısız');
      }
    },
    
    login: async (_, { email, password }) => {
      try {
        const response = await axios.post(`${AUTH_API_URL}/auth/login`, {
          email,
          password
        });
        return response.data;
      } catch (error) {
        throw new AuthenticationError('Giriş başarısız');
      }
    },
    
    logout: async (_, __, context) => {
      try {
        const { token } = getAuthToken(context);
        await axios.post(`${AUTH_API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return true;
      } catch (error) {
        throw new AuthenticationError('Çıkış başarısız');
      }
    },
    
    resetPassword: async (_, { token, newPassword }) => {
      try {
        await axios.post(`${AUTH_API_URL}/auth/reset-password`, {
          token,
          newPassword
        });
        return true;
      } catch (error) {
        throw new UserInputError('Şifre sıfırlama başarısız');
      }
    },
    
    requestPasswordReset: async (_, { email }) => {
      try {
        await axios.post(`${AUTH_API_URL}/auth/request-reset`, {
          email
        });
        return true;
      } catch (error) {
        throw new UserInputError('Şifre sıfırlama isteği başarısız');
      }
    },
    
    // Kullanıcı mutasyonları
    updateUser: async (_, { firstName, lastName }, context) => {
      try {
        const { token } = getAuthToken(context);
        const response = await axios.put(`${AUTH_API_URL}/users/me`, {
          firstName,
          lastName
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        throw new UserInputError('Kullanıcı güncellenemedi');
      }
    },
    
    updatePreferences: async (_, { preferences }, context) => {
      try {
        const { token } = getAuthToken(context);
        const response = await axios.put(`${AUTH_API_URL}/users/preferences`, {
          preferences
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        throw new UserInputError('Tercihler güncellenemedi');
      }
    },
    
    updateWatchlist: async (_, { symbols }, context) => {
      try {
        const { token } = getAuthToken(context);
        const response = await axios.put(`${AUTH_API_URL}/users/watchlist`, {
          symbols
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        throw new UserInputError('İzleme listesi güncellenemedi');
      }
    },
    
    // Önbellek mutasyonları
    clearCache: async (_, __, context) => {
      try {
        const { token } = getAuthToken(context);
        await axios.post(`${BINANCE_API_URL}/cache/clear`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return true;
      } catch (error) {
        throw new ForbiddenError('Önbellek temizlenemedi');
      }
    },
    
    setCacheTTL: async (_, { ttl }, context) => {
      try {
        const { token } = getAuthToken(context);
        await axios.post(`${BINANCE_API_URL}/cache/ttl`, {
          ttl
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return true;
      } catch (error) {
        throw new ForbiddenError('Önbellek TTL değeri ayarlanamadı');
      }
    },
    
    setThresholds: async (_, { price, volume }, context) => {
      try {
        const { token } = getAuthToken(context);
        const response = await axios.post(`${BINANCE_API_URL}/thresholds`, {
          price,
          volume
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        throw new ForbiddenError('Eşik değerleri ayarlanamadı');
      }
    },
  },
  
  // Abonelikler
  Subscription: {
    tickerUpdated: {
      subscribe: (_, { symbol }) => {
        return pubsub.asyncIterator([`${TICKER_UPDATED}.${symbol}`]);
      }
    },
    
    depthUpdated: {
      subscribe: (_, { symbol }) => {
        return pubsub.asyncIterator([`${DEPTH_UPDATED}.${symbol}`]);
      }
    },
    
    tradesUpdated: {
      subscribe: (_, { symbol }) => {
        return pubsub.asyncIterator([`${TRADES_UPDATED}.${symbol}`]);
      }
    },
  },
};

module.exports = resolvers; 