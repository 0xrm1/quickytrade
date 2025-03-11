/**
 * [symbol].js
 * 
 * Sembol detay sayfası.
 * ISR (Artımlı Statik Yeniden Oluşturma) kullanarak statik olarak oluşturulur.
 */

import { useState, Suspense, lazy } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { useMarketData, useKlinesData, MARKET_QUERY, KLINES_QUERY } from '../../src/hooks/useGraphQL';

// Dinamik olarak yüklenen grafik bileşeni
const DynamicChart = lazy(() => import('../../components/Chart'));

// Popüler semboller (statik sayfalar için)
const POPULAR_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT'];

// ISR için Apollo Client oluşturma
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

export default function SymbolDetail({ symbol, initialMarketData, initialKlinesData }) {
  const router = useRouter();
  const [interval, setInterval] = useState('1h');
  
  // Fallback için
  if (router.isFallback) {
    return <div className="container">Yükleniyor...</div>;
  }
  
  // GraphQL sorguları (istemci tarafında)
  const { loading: marketLoading, error: marketError, data: marketData } = useMarketData(symbol);
  const { loading: klinesLoading, error: klinesError, data: klinesData } = useKlinesData(symbol, interval, 10);
  
  // Sunucu tarafından veya istemci tarafından gelen verileri kullan
  const market = marketData?.market || initialMarketData?.market;
  const klines = klinesData?.klines || initialKlinesData?.klines || [];
  
  // Aralık seçenekleri
  const intervalOptions = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
  
  return (
    <div className="container">
      <Head>
        <title>{symbol} - QuickyTrade</title>
        <meta name="description" content={`${symbol} fiyat ve detay bilgileri - QuickyTrade`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">
          {symbol} <span className="highlight">Detayları</span>
        </h1>

        <Link href="/" className="back-link">
          ← Ana Sayfaya Dön
        </Link>

        <div className="grid">
          <div className="card full-width">
            <h2>Piyasa Bilgileri</h2>
            {marketLoading && !market ? (
              <p>Yükleniyor...</p>
            ) : marketError ? (
              <p>Hata: {marketError.message}</p>
            ) : market ? (
              <div className="market-info">
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">Son Fiyat:</span>
                    <span className="value">{market.lastPrice}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Değişim:</span>
                    <span className={`value ${parseFloat(market.priceChangePercent) >= 0 ? 'positive' : 'negative'}`}>
                      {market.priceChange} ({market.priceChangePercent}%)
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">24s Yüksek:</span>
                    <span className="value">{market.highPrice}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">24s Düşük:</span>
                    <span className="value">{market.lowPrice}</span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item">
                    <span className="label">24s Hacim:</span>
                    <span className="value">{market.volume}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">24s USDT Hacim:</span>
                    <span className="value">{market.quoteVolume}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p>Veri bulunamadı</p>
            )}
          </div>

          <div className="card full-width">
            <div className="card-header">
              <h2>Fiyat Geçmişi</h2>
              <div className="interval-selector">
                <span>Aralık:</span>
                <select value={interval} onChange={(e) => setInterval(e.target.value)}>
                  {intervalOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            {klinesLoading && klines.length === 0 ? (
              <p>Yükleniyor...</p>
            ) : klinesError ? (
              <p>Hata: {klinesError.message}</p>
            ) : klines.length > 0 ? (
              <>
                {typeof window !== 'undefined' && (
                  <Suspense fallback={<div>Grafik yükleniyor...</div>}>
                    <DynamicChart symbol={symbol} interval={interval} data={klines} />
                  </Suspense>
                )}
                <div className="klines-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Açılış</th>
                        <th>Yüksek</th>
                        <th>Düşük</th>
                        <th>Kapanış</th>
                        <th>Hacim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {klines.map((kline) => (
                        <tr key={kline.openTime}>
                          <td>{new Date(parseInt(kline.openTime)).toLocaleString()}</td>
                          <td>{kline.open}</td>
                          <td>{kline.high}</td>
                          <td>{kline.low}</td>
                          <td>{kline.close}</td>
                          <td>{kline.volume}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
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
          justify-content: flex-start;
          align-items: center;
        }

        .main {
          padding: 3rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          width: 100%;
          max-width: 1200px;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 3rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .highlight {
          color: #0070f3;
        }

        .back-link {
          margin-bottom: 2rem;
          color: #0070f3;
          text-decoration: none;
          font-size: 1.1rem;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .grid {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          flex-wrap: wrap;
          width: 100%;
        }

        .card {
          margin: 1rem;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          flex-basis: calc(50% - 2rem);
        }

        .full-width {
          flex-basis: calc(100% - 2rem);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .interval-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .interval-selector select {
          padding: 0.3rem 0.5rem;
          border-radius: 4px;
          border: 1px solid #ccc;
        }

        .card h2 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .market-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 2rem;
        }

        .info-item {
          flex: 1;
        }

        .label {
          font-weight: bold;
          margin-right: 0.5rem;
          color: #666;
        }

        .value {
          font-size: 1.1rem;
        }

        .positive {
          color: #00c853;
        }

        .negative {
          color: #ff3d00;
        }

        .klines-table {
          overflow-x: auto;
          width: 100%;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #eaeaea;
        }

        th {
          background-color: #f9f9f9;
          font-weight: bold;
        }

        tr:hover {
          background-color: #f5f5f5;
        }

        @media (max-width: 768px) {
          .info-row {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .card {
            flex-basis: 100%;
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

// Statik yolları oluşturma
export async function getStaticPaths() {
  return {
    paths: POPULAR_SYMBOLS.map((symbol) => ({
      params: { symbol },
    })),
    fallback: true, // Diğer semboller için talep üzerine oluşturma
  };
}

// Statik sayfaları oluşturma
export async function getStaticProps({ params }) {
  const { symbol } = params;
  const apolloClient = createApolloClient();

  try {
    // Market verisi çekme
    const { data: marketData } = await apolloClient.query({
      query: MARKET_QUERY,
      variables: { symbol },
    });

    // Kline verisi çekme
    const { data: klinesData } = await apolloClient.query({
      query: KLINES_QUERY,
      variables: { symbol, interval: '1h', limit: 10 },
    });

    return {
      props: {
        symbol,
        initialMarketData: marketData || null,
        initialKlinesData: klinesData || null,
      },
      revalidate: 60, // 60 saniyede bir yeniden oluşturma
    };
  } catch (error) {
    console.error('Statik sayfa oluşturma hatası:', error);
    
    return {
      props: {
        symbol,
        initialMarketData: null,
        initialKlinesData: null,
      },
      revalidate: 60,
    };
  }
} 