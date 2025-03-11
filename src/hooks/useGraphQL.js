/**
 * useGraphQL.js
 * 
 * GraphQL sorgularını ve mutasyonlarını kullanmak için özel hook'lar.
 * Apollo Client kullanarak GraphQL API ile iletişim kurar.
 */

import { useQuery, useMutation, gql } from '@apollo/client';

// GraphQL sorguları
export const TICKER_QUERY = gql`
  query GetTicker($symbol: String!) {
    ticker(symbol: $symbol) {
      symbol
      lastPrice
      priceChangePercent
      volume
      quoteVolume
      highPrice
      lowPrice
    }
  }
`;

export const TICKERS_QUERY = gql`
  query GetTickers($symbols: [String!]!) {
    tickers(symbols: $symbols) {
      symbol
      lastPrice
      priceChangePercent
      volume
    }
  }
`;

export const KLINES_QUERY = gql`
  query GetKlines($symbol: String!, $interval: String!, $limit: Int) {
    klines(symbol: $symbol, interval: $interval, limit: $limit) {
      openTime
      open
      high
      low
      close
      volume
      closeTime
      quoteVolume
      trades
    }
  }
`;

export const MARKET_QUERY = gql`
  query GetMarket($symbol: String!) {
    market(symbol: $symbol) {
      symbol
      priceChange
      priceChangePercent
      weightedAvgPrice
      prevClosePrice
      lastPrice
      lastQty
      bidPrice
      bidQty
      askPrice
      askQty
      openPrice
      highPrice
      lowPrice
      volume
      quoteVolume
      openTime
      closeTime
      firstId
      lastId
      count
    }
  }
`;

export const DEPTH_QUERY = gql`
  query GetDepth($symbol: String!, $limit: Int) {
    depth(symbol: $symbol, limit: $limit) {
      lastUpdateId
      bids {
        price
        quantity
      }
      asks {
        price
        quantity
      }
    }
  }
`;

export const CACHE_STATUS_QUERY = gql`
  query GetCacheStatus {
    cacheStatus {
      connected
      info {
        used_memory
        connected_clients
      }
    }
  }
`;

// GraphQL mutasyonları
export const SET_THRESHOLDS_MUTATION = gql`
  mutation SetThresholds($percentageThreshold: Float, $absoluteThreshold: Float, $timeThreshold: Int) {
    setThresholds(percentageThreshold: $percentageThreshold, absoluteThreshold: $absoluteThreshold, timeThreshold: $timeThreshold) {
      success
      message
    }
  }
`;

export const SET_CACHE_TTL_MUTATION = gql`
  mutation SetCacheTTL($type: String!, $ttl: Int!) {
    setCacheTTL(type: $type, ttl: $ttl) {
      success
      message
    }
  }
`;

export const CLEAR_CACHE_MUTATION = gql`
  mutation ClearCache($type: String!) {
    clearCache(type: $type) {
      success
      message
    }
  }
`;

// Hook'lar
export function useTickerData(symbol) {
  return useQuery(TICKER_QUERY, {
    variables: { symbol },
    pollInterval: 5000, // 5 saniyede bir yenileme
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  });
}

export function useTickersData(symbols) {
  return useQuery(TICKERS_QUERY, {
    variables: { symbols },
    pollInterval: 5000,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  });
}

export function useKlinesData(symbol, interval, limit = 100) {
  return useQuery(KLINES_QUERY, {
    variables: { symbol, interval, limit },
    pollInterval: 10000, // 10 saniyede bir yenileme
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  });
}

export function useMarketData(symbol) {
  return useQuery(MARKET_QUERY, {
    variables: { symbol },
    pollInterval: 5000,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  });
}

export function useDepthData(symbol, limit = 20) {
  return useQuery(DEPTH_QUERY, {
    variables: { symbol, limit },
    pollInterval: 3000, // 3 saniyede bir yenileme
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  });
}

export function useCacheStatus() {
  return useQuery(CACHE_STATUS_QUERY, {
    pollInterval: 30000, // 30 saniyede bir yenileme
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  });
}

export function useSetThresholds() {
  return useMutation(SET_THRESHOLDS_MUTATION);
}

export function useSetCacheTTL() {
  return useMutation(SET_CACHE_TTL_MUTATION);
}

export function useClearCache() {
  return useMutation(CLEAR_CACHE_MUTATION);
} 