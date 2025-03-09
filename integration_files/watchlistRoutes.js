const express = require('express');
const router = express.Router();
const Binance = require('binance-api-node').default;
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config();

// Binance client'ı oluştur
const binanceClient = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  futures: true
});

// Tüm sembolleri al
router.get('/symbols', async (req, res) => {
  try {
    const exchangeInfo = await binanceClient.futuresExchangeInfo();
    const symbols = exchangeInfo.symbols
      .filter(s => s.status === 'TRADING')
      .map(s => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
      }));
    
    res.json(symbols);
  } catch (error) {
    console.error('Sembol listesi alınırken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Watchlist'i saklamak için geçici bir array (veritabanı entegrasyonu daha sonra yapılacak)
let watchlist = [];

// Watchlist'e sembol ekle
router.post('/add', (req, res) => {
  const { symbol, listId = 1 } = req.body;
  
  // Sembol zaten watchlist'te var mı kontrol et
  const symbolExists = watchlist.find(item => item.symbol === symbol && item.listId === listId);
  
  if (symbolExists) {
    return res.status(400).json({ error: 'Sembol zaten watchlist\'te mevcut' });
  }
  
  // Sembolü watchlist'e ekle
  watchlist.push({
    symbol,
    listId,
    addedAt: new Date().toISOString()
  });
  
  res.status(201).json({ message: 'Sembol başarıyla eklendi', symbol, listId });
});

// Watchlist'ten sembol sil
router.delete('/remove/:symbol', (req, res) => {
  const { symbol } = req.params;
  const { listId = 1 } = req.query;
  
  // Sembol watchlist'te var mı kontrol et
  const symbolIndex = watchlist.findIndex(item => item.symbol === symbol && item.listId == listId);
  
  if (symbolIndex === -1) {
    return res.status(404).json({ error: 'Sembol watchlist\'te bulunamadı' });
  }
  
  // Sembolü watchlist'ten kaldır
  watchlist.splice(symbolIndex, 1);
  
  res.json({ message: 'Sembol başarıyla kaldırıldı', symbol, listId });
});

// Tüm watchlist'i getir
router.get('/', (req, res) => {
  const { listId } = req.query;
  
  if (listId) {
    // Belirli bir listeyi getir
    const filteredList = watchlist.filter(item => item.listId == listId);
    res.json({ watchlist: filteredList });
  } else {
    // Tüm listeyi getir
    res.json({ watchlist });
  }
});

// Watchlist'i güncelle (localStorage'dan gelen veriyi kaydet)
router.post('/sync', (req, res) => {
  const { watchlist: newWatchlist } = req.body;
  
  if (Array.isArray(newWatchlist)) {
    watchlist = newWatchlist;
    res.json({ success: true, message: 'Watchlist başarıyla senkronize edildi' });
  } else {
    res.status(400).json({ error: 'Geçersiz watchlist formatı' });
  }
});

// Sembolün ticker bilgisini al
router.get('/ticker/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const ticker = await binanceClient.futuresDailyStats({ symbol });
    res.json(ticker);
  } catch (error) {
    console.error('Ticker bilgisi alınırken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 