/**
 * Ana Uygulama Bileşeni
 * 
 * Bu bileşen, tüm sayfaları saran ana bileşendir. Apollo Client, tema sağlayıcı
 * ve diğer global bileşenleri içerir.
 */

import { useEffect } from 'react';
import Head from 'next/head';
import { ThemeProvider } from 'next-themes';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../lib/apollo';
import { Toaster } from 'react-hot-toast';
import NProgress from 'nprogress';
import Router from 'next/router';
import '../styles/globals.css';

// Sayfa geçişlerinde yükleme göstergesi
Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

function MyApp({ Component, pageProps }) {
  // Apollo Client'ı başlat
  const apolloClient = useApollo(pageProps.initialApolloState);
  
  // Sayfa geçişlerinde yukarı kaydır
  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo(0, 0);
    };
    
    Router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      Router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, []);
  
  // Sayfa props'larını al
  const getLayout = Component.getLayout || ((page) => page);
  
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>QuickyTrade - Hızlı ve Verimli Kripto Ticaret Platformu</title>
        <meta name="description" content="QuickyTrade ile kripto para ticareti yapın. Gerçek zamanlı fiyatlar, gelişmiş grafikler ve hızlı işlemler." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <ApolloProvider client={apolloClient}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {getLayout(<Component {...pageProps} />)}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </ApolloProvider>
    </>
  );
}

export default MyApp; 