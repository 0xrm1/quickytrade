/**
 * client.js
 * 
 * Apollo Client yapılandırması.
 * GraphQL API ile iletişim kurmak için kullanılır.
 * Önbelleğe alma, hata yönetimi ve durum yönetimi sağlar.
 */

import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

// GraphQL API endpoint'i
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/graphql';

// HTTP bağlantısı
const httpLink = new HttpLink({
  uri: API_URL,
  credentials: 'same-origin',
});

// Hata işleme
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Önbellek yapılandırması
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        ticker: {
          // Ticker verilerini sembol ile önbelleğe alma
          keyArgs: ['symbol'],
          merge(existing, incoming) {
            return incoming;
          },
        },
        tickers: {
          // Tickers verilerini semboller ile önbelleğe alma
          keyArgs: ['symbols'],
          merge(existing, incoming) {
            return incoming;
          },
        },
        klines: {
          // Kline verilerini sembol ve interval ile önbelleğe alma
          keyArgs: ['symbol', 'interval'],
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

// Apollo Client örneği oluşturma
const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
});

export default client; 