/**
 * GraphQL Şema Tanımı
 * 
 * Bu dosya, QuickyTrade uygulamasının GraphQL şemasını tanımlar.
 * Şema, kullanıcı kimlik doğrulama, piyasa verileri, işlemler ve kullanıcı ayarları için
 * gerekli tüm tip ve sorguları içerir.
 */

const { gql } = require('apollo-server-express');

const typeDefs = gql`
  # Skaler tipler
  scalar Date
  scalar JSON

  # Kullanıcı tipi
  type User {
    id: ID!
    email: String!
    username: String!
    firstName: String
    lastName: String
    createdAt: Date!
    updatedAt: Date!
    preferences: UserPreferences
    watchlist: [String]
    isVerified: Boolean!
  }

  # Kullanıcı tercihleri
  type UserPreferences {
    theme: String
    language: String
    notifications: NotificationSettings
    tradingView: TradingViewSettings
  }

  # Bildirim ayarları
  type NotificationSettings {
    email: Boolean
    push: Boolean
    priceAlerts: Boolean
  }

  # TradingView ayarları
  type TradingViewSettings {
    interval: String
    indicators: [String]
    chartType: String
  }

  # Kimlik doğrulama yanıtı
  type AuthResponse {
    token: String
    user: User
  }

  # Ticker bilgisi
  type Ticker {
    symbol: String!
    price: String!
    priceChange: String!
    priceChangePercent: String!
    volume: String!
    quoteVolume: String!
    high: String!
    low: String!
    openTime: Date!
    closeTime: Date!
    lastUpdated: Date!
  }

  # Kline (mum) verisi
  type Kline {
    openTime: Date!
    open: String!
    high: String!
    low: String!
    close: String!
    volume: String!
    closeTime: Date!
    quoteVolume: String!
    trades: Int!
    takerBuyBaseVolume: String!
    takerBuyQuoteVolume: String!
  }

  # Market derinliği
  type Depth {
    lastUpdateId: Int!
    bids: [DepthLevel!]!
    asks: [DepthLevel!]!
  }

  # Derinlik seviyesi
  type DepthLevel {
    price: String!
    quantity: String!
  }

  # İşlem
  type Trade {
    id: Int!
    price: String!
    quantity: String!
    time: Date!
    isBuyerMaker: Boolean!
    isBestMatch: Boolean!
  }

  # Borsa bilgisi
  type ExchangeInfo {
    timezone: String!
    serverTime: Date!
    symbols: [SymbolInfo!]!
  }

  # Sembol bilgisi
  type SymbolInfo {
    symbol: String!
    status: String!
    baseAsset: String!
    quoteAsset: String!
    filters: JSON!
  }

  # Önbellek durumu
  type CacheStatus {
    enabled: Boolean!
    ttl: Int!
    size: Int!
    hits: Int!
    misses: Int!
  }

  # Eşik değerleri
  type Thresholds {
    price: Float!
    volume: Float!
  }

  # Sorgular
  type Query {
    # Kullanıcı sorguları
    me: User
    user(id: ID!): User
    
    # Piyasa verileri sorguları
    ticker(symbol: String!): Ticker
    tickers(symbols: [String!]): [Ticker!]!
    klines(symbol: String!, interval: String!, limit: Int): [Kline!]!
    depth(symbol: String!, limit: Int): Depth
    trades(symbol: String!, limit: Int): [Trade!]!
    exchangeInfo: ExchangeInfo
    
    # Önbellek sorguları
    cacheStatus: CacheStatus
    thresholds: Thresholds
  }

  # Mutasyonlar
  type Mutation {
    # Kimlik doğrulama mutasyonları
    register(email: String!, password: String!, username: String!): AuthResponse!
    login(email: String!, password: String!): AuthResponse!
    logout: Boolean!
    resetPassword(token: String!, newPassword: String!): Boolean!
    requestPasswordReset(email: String!): Boolean!
    
    # Kullanıcı mutasyonları
    updateUser(firstName: String, lastName: String): User!
    updatePreferences(preferences: UserPreferencesInput!): User!
    updateWatchlist(symbols: [String!]!): User!
    
    # Önbellek mutasyonları
    clearCache: Boolean!
    setCacheTTL(ttl: Int!): Boolean!
    setThresholds(price: Float!, volume: Float!): Thresholds!
  }

  # Abonelikler
  type Subscription {
    tickerUpdated(symbol: String!): Ticker!
    depthUpdated(symbol: String!): Depth!
    tradesUpdated(symbol: String!): Trade!
  }

  # Giriş tipleri
  input UserPreferencesInput {
    theme: String
    language: String
    notifications: NotificationSettingsInput
    tradingView: TradingViewSettingsInput
  }

  input NotificationSettingsInput {
    email: Boolean
    push: Boolean
    priceAlerts: Boolean
  }

  input TradingViewSettingsInput {
    interval: String
    indicators: [String]
    chartType: String
  }
`;

module.exports = typeDefs; 