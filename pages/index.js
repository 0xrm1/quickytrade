/**
 * index.js
 * 
 * Ana sayfa bileşeni.
 * GraphQL API'den veri çeker ve gösterir.
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTickerData, useTickersData, useCacheStatus, TICKER_QUERY, TICKERS_QUERY, CACHE_STATUS_QUERY } from '../src/hooks/useGraphQL';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

// Popüler semboller
const POPULAR_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT'];

// SSR için Apollo Client oluşturma
function createApolloClient() {
  return new ApolloClient({
    ssrMode: true,
    link: from([
      onError(({ graphQLErrors, networkError }) => {
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
      }),
      new HttpLink({
        uri: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/graphql',
        credentials: 'same-origin',
      }),
    ]),
    cache: new InMemoryCache(),
  });
}

export default function Home({ initialTickerData, initialTickersData, initialCacheStatus }) {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  
  // GraphQL sorguları (istemci tarafında)
  const { loading: tickerLoading, error: tickerError, data: tickerData } = useTickerData(selectedSymbol);
  const { loading: tickersLoading, error: tickersError, data: tickersData } = useTickersData(POPULAR_SYMBOLS);
  const { loading: cacheLoading, error: cacheError, data: cacheData } = useCacheStatus();
  
  // Sunucu tarafından veya istemci tarafından gelen verileri kullan
  const ticker = tickerData?.ticker || initialTickerData?.ticker;
  const tickers = tickersData?.tickers || initialTickersData?.tickers || [];
  const cacheStatus = cacheData?.cacheStatus || initialCacheStatus?.cacheStatus;
  
  return (
    <div className="container">
      <Head>
        <title>QuickyTrade - Optimize Edilmiş Ticaret Platformu</title>
        <meta name="description" content="Optimize edilmiş gerçek zamanlı ticaret platformu" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">
          QuickyTrade <span className="highlight">Optimize Edilmiş</span> Platform
        </h1>

        <p className="description">
          GraphQL API ve Apollo Client ile optimize edilmiş veri çekme
        </p>

        <div className="grid">
          <div className="card">
            <h2>Seçili Sembol: {selectedSymbol}</h2>
            {tickerLoading && !ticker ? (
              <p>Yükleniyor...</p>
            ) : tickerError ? (
              <p>Hata: {tickerError.message}</p>
            ) : ticker ? (
              <div>
                <p><strong>Fiyat:</strong> {ticker.lastPrice}</p>
                <p><strong>Değişim (%):</strong> {ticker.priceChangePercent}%</p>
                <p><strong>Hacim:</strong> {ticker.volume}</p>
                <p><strong>En Yüksek:</strong> {ticker.highPrice}</p>
                <p><strong>En Düşük:</strong> {ticker.lowPrice}</p>
                <Link href={`/symbol/${selectedSymbol}`} className="view-details">
                  Detayları Görüntüle →
                </Link>
              </div>
            ) : (
              <p>Veri bulunamadı</p>
            )}
          </div>

          <div className="card">
            <h2>Popüler Semboller</h2>
            {tickersLoading && tickers.length === 0 ? (
              <p>Yükleniyor...</p>
            ) : tickersError ? (
              <p>Hata: {tickersError.message}</p>
            ) : tickers.length > 0 ? (
              <ul>
                {tickers.map((ticker) => (
                  <li key={ticker.symbol}>
                    <div className="symbol-row" onClick={() => setSelectedSymbol(ticker.symbol)}>
                      <strong>{ticker.symbol}</strong>: {ticker.lastPrice} ({ticker.priceChangePercent}%)
                    </div>
                    <Link href={`/symbol/${ticker.symbol}`} className="symbol-link">
                      Detaylar →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Veri bulunamadı</p>
            )}
          </div>

          <div className="card">
            <h2>Cache Durumu</h2>
            {cacheLoading && !cacheStatus ? (
              <p>Yükleniyor...</p>
            ) : cacheError ? (
              <p>Hata: {cacheError.message}</p>
            ) : cacheStatus ? (
              <div>
                <p><strong>Bağlantı:</strong> {cacheStatus.connected ? 'Bağlı' : 'Bağlı Değil'}</p>
                {cacheStatus.info && (
                  <>
                    <p><strong>Kullanılan Bellek:</strong> {cacheStatus.info.used_memory}</p>
                    <p><strong>Bağlı İstemciler:</strong> {cacheStatus.info.connected_clients}</p>
                  </>
                )}
              </div>
            ) : (
              <p>Veri bulunamadı</p>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          text-align: center;
        }

        .highlight {
          color: #0070f3;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
          text-align: center;
        }

        .grid {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          flex-wrap: wrap;
          max-width: 1200px;
          margin-top: 3rem;
        }

        .card {
          margin: 1rem;
          flex-basis: 30%;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .card:hover,
        .card:focus,
        .card:active {
          border-color: #0070f3;
        }

        .card h2 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        ul {
          padding-left: 1.5rem;
        }

        li {
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        li:hover .symbol-row {
          color: #0070f3;
        }

        .view-details {
          display: inline-block;
          margin-top: 1rem;
          color: #0070f3;
          text-decoration: none;
        }

        .view-details:hover {
          text-decoration: underline;
        }

        .symbol-row {
          cursor: pointer;
          display: inline-block;
        }

        .symbol-link {
          margin-left: 0.5rem;
          color: #0070f3;
          text-decoration: none;
          font-size: 0.9rem;
        }

        .symbol-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

// Sunucu tarafında veri çekme
export async function getServerSideProps() {
  const apolloClient = createApolloClient();

  try {
    // Ticker verisi çekme
    const { data: tickerData } = await apolloClient.query({
      query: TICKER_QUERY,
      variables: { symbol: 'BTCUSDT' },
    });

    // Tickers verisi çekme
    const { data: tickersData } = await apolloClient.query({
      query: TICKERS_QUERY,
      variables: { symbols: POPULAR_SYMBOLS },
    });

    // Cache durumu çekme
    const { data: cacheStatus } = await apolloClient.query({
      query: CACHE_STATUS_QUERY,
    });

    return {
      props: {
        initialTickerData: tickerData || null,
        initialTickersData: tickersData || null,
        initialCacheStatus: cacheStatus || null,
      },
    };
  } catch (error) {
    console.error('Sunucu tarafında veri çekme hatası:', error);
    
    return {
      props: {
        initialTickerData: null,
        initialTickersData: null,
        initialCacheStatus: null,
      },
    };
  }
} 