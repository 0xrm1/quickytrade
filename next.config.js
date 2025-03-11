/**
 * next.config.js
 * 
 * Next.js yapılandırma dosyası.
 * Özel yapılandırmaları ve optimizasyonları içerir.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Statik optimizasyon
  images: {
    domains: ['assets.quickytrade.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Incremental Static Regeneration
  experimental: {
    // Daha hızlı yeniden oluşturma için
    concurrentFeatures: true,
    // Daha iyi kod bölme
    optimizeCss: true,
    // Daha hızlı sayfa yükleme
    scrollRestoration: true,
  },
  
  // Webpack yapılandırması
  webpack: (config, { dev, isServer }) => {
    // Sıkıştırma için pako eklentisi
    config.resolve.alias['pako'] = require.resolve('pako');
    
    // Üretim ortamında kod sıkıştırma
    if (!dev && !isServer) {
      config.optimization.minimize = true;
    }
    
    return config;
  },
  
  // API proxy yapılandırması
  async rewrites() {
    return [
      {
        source: '/api/binance/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/binance/:path*` : 'http://localhost:5000/api/binance/:path*',
      },
      {
        source: '/api/auth/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/:path*` : 'http://localhost:5000/api/auth/:path*',
      },
      {
        source: '/api/users/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/users/:path*` : 'http://localhost:5000/api/users/:path*',
      },
      {
        source: '/graphql',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/graphql` : 'http://localhost:5000/graphql',
      },
      {
        source: '/ws',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/ws` : 'http://localhost:5000/ws',
      },
    ];
  },
  
  // HTTP başlıkları
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Önbellek stratejisi
  generateEtags: true,
  
  // Gzip sıkıştırma
  compress: true,
  
  // Sayfa yönlendirmeleri
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Statik sayfa oluşturma
  // Popüler semboller için statik sayfalar oluştur
  async generateStaticParams() {
    const popularSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT'];
    
    return popularSymbols.map((symbol) => ({
      params: { symbol },
    }));
  },
  
  // Statik sayfa yenileme
  staticPageGenerationTimeout: 120,
};

module.exports = nextConfig; 