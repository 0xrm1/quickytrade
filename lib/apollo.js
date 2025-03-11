/**
 * Apollo Client Yapılandırması
 * 
 * Bu dosya, Apollo Client'ı yapılandırır ve GraphQL API ile iletişim için gerekli
 * bağlantıları ve önbellek stratejilerini ayarlar. WebSocket abonelikleri için
 * GraphQLWsLink kullanılır.
 */

import { useMemo } from 'react';
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import merge from 'deepmerge';
import isEqual from 'lodash/isEqual';

// Apollo Client önbelleği
let apolloClient;

// API URL'leri
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const GRAPHQL_HTTP_URL = `${API_URL}/graphql`;
const GRAPHQL_WS_URL = API_URL.replace(/^http/, 'ws') + '/graphql';

// Hata işleme bağlantısı
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

// Kimlik doğrulama bağlantısı
const authLink = setContext((_, { headers }) => {
  // Tarayıcı ortamında token'ı localStorage'dan al
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// HTTP bağlantısı
const httpLink = new HttpLink({
  uri: GRAPHQL_HTTP_URL,
  credentials: 'same-origin',
});

// WebSocket bağlantısı (yalnızca tarayıcı ortamında)
const createWSLink = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return new GraphQLWsLink(
    createClient({
      url: GRAPHQL_WS_URL,
      connectionParams: () => {
        const token = localStorage.getItem('token');
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
    })
  );
};

// HTTP ve WebSocket bağlantılarını birleştir
const createLink = () => {
  const wsLink = createWSLink();
  
  if (!wsLink) {
    return authLink.concat(errorLink).concat(httpLink);
  }
  
  // Sorgu türüne göre HTTP veya WebSocket bağlantısını kullan
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    httpLink
  );
  
  return authLink.concat(errorLink).concat(splitLink);
};

// Önbellek yapılandırması
const createCache = () => {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Ticker verileri için birleştirme stratejisi
          tickers: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          // Kline verileri için birleştirme stratejisi
          klines: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  });
};

// Apollo Client oluşturma
function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined', // SSR modunda çalışıp çalışmadığını belirle
    link: createLink(),
    cache: createCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
    connectToDevTools: process.env.NODE_ENV !== 'production',
  });
}

// Apollo Client'ı başlat veya yeniden kullan
export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient();
  
  // Sunucu tarafında her zaman yeni bir Apollo Client örneği oluştur
  if (typeof window === 'undefined') {
    return _apolloClient;
  }
  
  // İstemci tarafında, mevcut örneği yeniden kullan
  if (!apolloClient) {
    apolloClient = _apolloClient;
  }
  
  // Başlangıç durumu varsa, önbelleği birleştir
  if (initialState) {
    // Mevcut önbellek durumunu al
    const existingCache = _apolloClient.cache.extract();
    
    // Başlangıç durumunu mevcut önbellek ile birleştir
    const data = merge(initialState, existingCache, {
      // Birleştirme stratejisi: Dizileri birleştirirken eşit nesneleri birleştir
      arrayMerge: (destinationArray, sourceArray) => [
        ...sourceArray,
        ...destinationArray.filter((d) =>
          sourceArray.every((s) => !isEqual(d, s))
        ),
      ],
    });
    
    // Birleştirilmiş veriyi önbelleğe yaz
    _apolloClient.cache.restore(data);
  }
  
  return _apolloClient;
}

// useApollo hook'u
export function useApollo(initialState) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
} 