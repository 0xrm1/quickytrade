// Sembol için doğru ondalık hassasiyetini belirle
export const getSymbolPricePrecision = (symbol: string): number => {
  // Bilinen semboller için hassasiyet değerleri - Özel durumlar
  const precisionMap: Record<string, number> = {
    'BTCUSDT': 1,    // Bitcoin genellikle 1 ondalık basamak (örn: 42345.5)
    'ETHUSDT': 2,    // Ethereum genellikle 2 ondalık basamak (örn: 2345.25)
    'BNBUSDT': 2,    // BNB genellikle 2 ondalık basamak (örn: 345.25)
    'SOLUSDT': 3,    // Solana genellikle 3 ondalık basamak (örn: 145.240)
    'AVAXUSDT': 3,   // Avalanche genellikle 3 ondalık basamak
    'DOTUSDT': 3,    // Polkadot genellikle 3 ondalık basamak
    'ADAUSDT': 4,    // Cardano genellikle 4 ondalık basamak
    'MATICUSDT': 4,  // Polygon genellikle 4 ondalık basamak
    'XRPUSDT': 4,    // XRP genellikle 4 ondalık basamak (örn: 0.5234)
    'DOGEUSDT': 6,   // Doge genellikle 6 ondalık basamak (örn: 0.123456)
    'SHIBUSDT': 6,   // Shiba Inu genellikle 6 ondalık basamak
  };
  
  // Eğer sembol bilinen bir sembolse, hassasiyet değerini döndür
  if (precisionMap[symbol]) {
    return precisionMap[symbol];
  }
  
  // Bilinen semboller listesinde yoksa, sembol tipine göre hassasiyet belirle
  if (symbol.endsWith('USDT') || symbol.endsWith('BUSD') || symbol.endsWith('USDC')) {
    // Yüksek değerli coinler (BTC, ETH, vb.)
    if (symbol.startsWith('BTC') || symbol.startsWith('ETH')) {
      return 2; // 12345.67
    }
    // Orta değerli coinler (SOL, AVAX, vb.)
    else if (symbol.startsWith('SOL') || symbol.startsWith('AVAX') || symbol.startsWith('DOT')) {
      return 3; // 123.456
    }
    // Düşük değerli coinler (XRP, ADA, vb.)
    else if (symbol.startsWith('XRP') || symbol.startsWith('ADA') || symbol.startsWith('MATIC')) {
      return 4; // 1.2345
    }
    // Çok düşük değerli coinler (SHIB, DOGE, vb.)
    else if (symbol.startsWith('SHIB') || symbol.startsWith('DOGE')) {
      return 6; // 0.001234
    }
  }
  
  // Bilinmeyen semboller için varsayılan değer
  return 4;
};

// Sembol için pozisyon adetinin ondalık basamak sayısını belirle
export const getSymbolQuantityPrecision = (symbol: string): number => {
  // Sembol tipine göre uygun ondalık basamak sayısını belirle
  if (symbol.startsWith('BTC')) {
    return 5; // Bitcoin için 5 ondalık basamak (örn: 0.00123)
  } else if (symbol.startsWith('ETH')) {
    return 4; // Ethereum için 4 ondalık basamak (örn: 0.1234)
  } else if (symbol.startsWith('SOL') || symbol.startsWith('AVAX') || symbol.startsWith('DOT')) {
    return 3; // Orta değerli coinler için 3 ondalık basamak (örn: 12.345)
  } else if (symbol.startsWith('XRP') || symbol.startsWith('ADA') || symbol.startsWith('MATIC')) {
    return 2; // Düşük değerli coinler için 2 ondalık basamak (örn: 123.45)
  } else if (symbol.startsWith('SHIB') || symbol.startsWith('DOGE')) {
    return 0; // Çok düşük değerli coinler için 0 ondalık basamak (örn: 12345)
  }
  
  // Bilinmeyen semboller için varsayılan değer
  return 3;
}; 