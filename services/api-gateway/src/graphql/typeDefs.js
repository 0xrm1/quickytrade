const { gql } = require('apollo-server-express');

const typeDefs = gql`
  # User types
  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    isEmailVerified: Boolean!
    lastLogin: String
    preferences: UserPreferences
    createdAt: String!
    updatedAt: String!
  }

  type UserPreferences {
    theme: String
    notifications: NotificationPreferences
    defaultCurrency: String
  }

  type NotificationPreferences {
    email: Boolean
    push: Boolean
  }

  type AuthPayload {
    user: User!
    tokens: Tokens!
  }

  type Tokens {
    accessToken: String!
    refreshToken: String!
    accessTokenExpiry: String!
    refreshTokenExpiry: String!
  }

  # Market data types
  type Symbol {
    symbol: String!
    baseAsset: String!
    quoteAsset: String!
    status: String!
    isSpotTradingAllowed: Boolean!
    isFutureTradingAllowed: Boolean!
    filters: [JSON]
  }

  type TickerPrice {
    symbol: String!
    price: String!
    timestamp: String!
  }

  type Ticker24hr {
    symbol: String!
    priceChange: String!
    priceChangePercent: String!
    weightedAvgPrice: String!
    prevClosePrice: String!
    lastPrice: String!
    lastQty: String!
    bidPrice: String!
    bidQty: String!
    askPrice: String!
    askQty: String!
    openPrice: String!
    highPrice: String!
    lowPrice: String!
    volume: String!
    quoteVolume: String!
    openTime: String!
    closeTime: String!
    count: Int!
  }

  type Kline {
    symbol: String!
    interval: String!
    openTime: String!
    open: String!
    high: String!
    low: String!
    close: String!
    volume: String!
    closeTime: String!
    quoteAssetVolume: String!
    trades: Int!
    takerBuyBaseAssetVolume: String!
    takerBuyQuoteAssetVolume: String!
  }

  type OrderBookEntry {
    price: String!
    quantity: String!
  }

  type OrderBook {
    symbol: String!
    lastUpdateId: String!
    bids: [OrderBookEntry!]!
    asks: [OrderBookEntry!]!
  }

  type Trade {
    id: String!
    symbol: String!
    price: String!
    qty: String!
    time: String!
    isBuyerMaker: Boolean!
    isBestMatch: Boolean!
  }

  # Scalar for JSON data
  scalar JSON

  # Queries
  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(page: Int, limit: Int, role: String, search: String): UserPagination

    # Market data queries
    symbols: [Symbol!]!
    symbol(symbol: String!): Symbol
    tickerPrice(symbol: String): [TickerPrice!]!
    ticker24hr(symbol: String): [Ticker24hr!]!
    klines(symbol: String!, interval: String!, limit: Int): [Kline!]!
    orderBook(symbol: String!, limit: Int): OrderBook
    trades(symbol: String!, limit: Int): [Trade!]!
  }

  # Pagination
  type UserPagination {
    users: [User!]!
    count: Int!
    total: Int!
    page: Int!
    pages: Int!
  }

  # Mutations
  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): User!
    login(input: LoginInput!): AuthPayload!
    refreshToken(refreshToken: String!): Tokens!
    logout(refreshToken: String!): Boolean!
    changePassword(input: ChangePasswordInput!): Boolean!
    forgotPassword(email: String!): Boolean!
    resetPassword(token: String!, password: String!): Boolean!
    
    # User mutations
    updateUser(id: ID!, input: UpdateUserInput!): User!
    updatePreferences(input: PreferencesInput!): User!
    deleteUser(id: ID!): Boolean!
    revokeAllSessions: Boolean!
  }

  # Input types
  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
    revokeAll: Boolean
  }

  input UpdateUserInput {
    username: String
    email: String
    role: String
    isEmailVerified: Boolean
    preferences: PreferencesInput
  }

  input PreferencesInput {
    theme: String
    notifications: NotificationPreferencesInput
    defaultCurrency: String
  }

  input NotificationPreferencesInput {
    email: Boolean
    push: Boolean
  }

  # Subscriptions
  type Subscription {
    tickerUpdated(symbol: String!): TickerPrice!
    klineUpdated(symbol: String!, interval: String!): Kline!
    orderBookUpdated(symbol: String!): OrderBook!
    tradeExecuted(symbol: String!): Trade!
  }
`;

module.exports = typeDefs; 