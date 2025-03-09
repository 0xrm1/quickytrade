// Sembol için doğru ondalık hassasiyetini belirle
export const getSymbolPricePrecision = (symbol: string): number => {
  // Bilinen semboller için hassasiyet değerleri
  const precisionMap: Record<string, number> = {
    'BTCUSDT': 1,    // Bitcoin genellikle 1 ondalık basamak (örn: 42345.5)
    'ETHUSDT': 2,    // Ethereum genellikle 2 ondalık basamak (örn: 2345.25)
    'SOLUSDT': 3,    // Solana genellikle 3 ondalık basamak (örn: 145.240)
    'XRPUSDT': 5,    // XRP genellikle 5 ondalık basamak (örn: 0.52345)
    'DOGEUSDT': 6,   // Doge genellikle 6 ondalık basamak (örn: 0.123456)
    'BNBUSDT': 2,    // BNB genellikle 2 ondalık basamak (örn: 345.25)
  };
  
  // Eğer sembol bilinen bir sembolse, hassasiyet değerini döndür
  if (precisionMap[symbol]) {
    return precisionMap[symbol];
  }
  
  // Bilinmeyen semboller için varsayılan değer
  return 3;
}; 