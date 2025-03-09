const express = require('express');
const router = express.Router();
const Binance = require('binance-api-node').default;
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config();

// API anahtarlarının geçerli olup olmadığını kontrol et
const hasValidAPIKeys = process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET_KEY && 
                        process.env.BINANCE_API_KEY.length > 5 && 
                        process.env.BINANCE_SECRET_KEY.length > 5 &&
                        process.env.BINANCE_API_KEY !== 'YOUR_API_KEY' &&
                        process.env.BINANCE_SECRET_KEY !== 'YOUR_SECRET_KEY';

console.log('Positions Routes - API Anahtarları:', {
  durum: hasValidAPIKeys ? 'Geçerli API anahtarları mevcut' : 'Geçerli API anahtarları bulunamadı',
  apiKeyLength: process.env.BINANCE_API_KEY ? process.env.BINANCE_API_KEY.length : 0,
  secretKeyLength: process.env.BINANCE_SECRET_KEY ? process.env.BINANCE_SECRET_KEY.length : 0
});

// Binance client'ı oluştur
const binanceClient = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  futures: true
});

// Sembol için doğru hassasiyet değerini bulan yardımcı fonksiyon
async function getSymbolPrecision(symbol) {
  try {
    const exchangeInfo = await binanceClient.futuresExchangeInfo();
    const symbolInfo = exchangeInfo.symbols.find(s => s.symbol === symbol);
    
    if (!symbolInfo) {
      console.log(`${symbol} sembolü bulunamadı.`);
      return 3; // Varsayılan değer olarak 3 kullanılıyor
    }
    
    // Sembol için doğru hassasiyet değerini bul
    const lotSizeFilter = symbolInfo.filters.find(filter => filter.filterType === 'LOT_SIZE');
    const stepSize = parseFloat(lotSizeFilter.stepSize);
    
    // Step size'a göre ondalık hassasiyeti hesapla
    const precision = stepSize === 1 ? 0 : stepSize.toString().split('.')[1].length;
    
    console.log(`Sembol: ${symbol}, Step Size: ${stepSize}, Hassasiyet: ${precision}`);
    return precision;
  } catch (error) {
    console.error(`Hassasiyet bulunamadı: ${error.message}`);
    return 3; // Hata durumunda varsayılan değer
  }
}

// Tüm pozisyonları al
router.get('/', async (req, res) => {
  try {
    console.log('Positions API çağrıldı');
    
    // API anahtarlarını kontrol et
    console.log('API Anahtarları:', {
      apiKey: process.env.BINANCE_API_KEY ? 'Mevcut' : 'Yok',
      secretKey: process.env.BINANCE_SECRET_KEY ? 'Mevcut' : 'Yok',
      apiKeyLength: process.env.BINANCE_API_KEY ? process.env.BINANCE_API_KEY.length : 0,
      secretKeyLength: process.env.BINANCE_SECRET_KEY ? process.env.BINANCE_SECRET_KEY.length : 0
    });

    // API anahtarlarının geçerliliğini kontrol et
    if (!hasValidAPIKeys) {
      return res.status(403).json({ 
        error: 'Geçerli API anahtarları yapılandırılmadı. Lütfen .env dosyasını kontrol edin.' 
      });
    }

    // Pozisyonları getir
    const positions = await binanceClient.futuresPositionRisk();
    console.log('Futures Position Risk Yanıtı:', JSON.stringify(positions));
    
    // Sadece gerçekten açık olan pozisyonları filtrele (position amount != 0)
    const activePositions = positions.filter(p => parseFloat(p.positionAmt) !== 0);
    console.log('Aktif Pozisyonlar:', JSON.stringify(activePositions));
    
    // Her pozisyon için daha detaylı bilgi getir
    const enrichedPositions = await Promise.all(activePositions.map(async (position) => {
      try {
        // Mark fiyatını al
        console.log(`${position.symbol} için mark fiyatı alınıyor...`);
        const markPriceData = await binanceClient.futuresMarkPrice({ symbol: position.symbol });
        console.log(`${position.symbol} Mark Price Verisi:`, markPriceData);
        const markPrice = parseFloat(markPriceData.markPrice || markPriceData.price || position.markPrice);
        
        // Pozisyon büyüklüğü
        const positionAmt = parseFloat(position.positionAmt);
        const side = positionAmt > 0 ? 'LONG' : 'SHORT';
        
        // Binance'dan doğrudan alınan veri
        const entryPrice = parseFloat(position.entryPrice);
        const leverage = parseFloat(position.leverage);
        
        // Likidasyon fiyatını doğrudan Binance'dan al 
        const liqPrice = parseFloat(position.liquidationPrice);
        
        // Kâr/zarar bilgisini doğrudan Binance'dan al
        const pnl = parseFloat(position.unRealizedProfit);
        
        // ROE (Return on Equity) hesaplaması - Binance'ın kullandığı resmi formül
        let roe = 0;
        
        if (entryPrice > 0 && positionAmt !== 0) {
          // Pozisyon değeri ve marjin hesaplama
          const positionValue = Math.abs(positionAmt) * entryPrice;
          const margin = positionValue / leverage;
          
          if (margin > 0) {
            roe = (pnl / margin) * 100;
          }
        }
        
        return {
          symbol: position.symbol,
          side,
          positionAmt: positionAmt < 0 ? positionAmt * -1 : positionAmt, // Mutlak değer
          entryPrice,
          markPrice,
          liquidationPrice: liqPrice,
          leverage,
          unRealizedProfit: pnl,
          roe: roe.toFixed(2), // ROE'yi frontend'e gönder
          marginType: position.marginType,
          // Diğer faydalı bilgileri de ekleyelim
          isolatedWallet: position.isolatedWallet,
          initialMargin: position.initialMargin,
          maintMargin: position.maintMargin
        };
      } catch (error) {
        console.error(`Pozisyon zenginleştirme hatası (${position.symbol}):`, error);
        return position; // Hata durumunda orijinal pozisyonu döndür
      }
    }));
    
    // Yanıt formatını frontend ile uyumlu hale getir
    res.json({ positions: enrichedPositions });
  } catch (error) {
    console.error('Pozisyonlar alınırken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pozisyonu kapat
router.post('/close', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Sembol belirtilmedi' });
    }
    
    // API anahtarlarının geçerliliğini kontrol et
    if (!hasValidAPIKeys) {
      return res.status(403).json({ 
        error: 'Geçerli API anahtarları yapılandırılmadı. Lütfen .env dosyasını kontrol edin.' 
      });
    }
    
    // Pozisyon bilgilerini al
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `${symbol} için açık pozisyon bulunamadı` });
    }
    
    const position = positions[0];
    const side = parseFloat(position.positionAmt) > 0 ? 'SELL' : 'BUY';
    const quantity = Math.abs(parseFloat(position.positionAmt));
    
    // Sembol için doğru hassasiyet değerini al
    const precision = await getSymbolPrecision(symbol);
    
    console.log(`Pozisyon kapatılıyor: ${symbol}, Miktar: ${quantity}, Hassasiyet: ${precision}`);
    
    // Market emri ile kapat
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'MARKET',
      quantity: quantity.toFixed(precision),
      reduceOnly: true
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      price: order.price,
      quantity: order.origQty,
      message: `Pozisyon kapatıldı: ${symbol}`
    });
  } catch (error) {
    console.error('Pozisyon kapatma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop loss ekle
router.post('/stop-loss', async (req, res) => {
  try {
    const { symbol, price } = req.body;
    
    if (!symbol || !price) {
      return res.status(400).json({ error: 'Sembol veya fiyat belirtilmedi' });
    }
    
    // API anahtarlarının geçerliliğini kontrol et
    if (!hasValidAPIKeys) {
      return res.status(403).json({ 
        error: 'Geçerli API anahtarları yapılandırılmadı. Lütfen .env dosyasını kontrol edin.' 
      });
    }
    
    // Pozisyon bilgilerini al
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `${symbol} için açık pozisyon bulunamadı` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const quantity = Math.abs(positionAmt);
    
    // Stop Loss emri oluştur
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'STOP_MARKET',
      stopPrice: price,
      closePosition: true,
      workingType: 'MARK_PRICE'
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      stopPrice: order.stopPrice,
      message: `Stop Loss emri oluşturuldu: ${symbol} @ ${price}`
    });
  } catch (error) {
    console.error('Stop Loss eklerken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Take profit ekle
router.post('/take-profit', async (req, res) => {
  try {
    const { symbol, price } = req.body;
    
    if (!symbol || !price) {
      return res.status(400).json({ error: 'Sembol veya fiyat belirtilmedi' });
    }
    
    // API anahtarlarının geçerliliğini kontrol et
    if (!hasValidAPIKeys) {
      return res.status(403).json({ 
        error: 'Geçerli API anahtarları yapılandırılmadı. Lütfen .env dosyasını kontrol edin.' 
      });
    }
    
    // Pozisyon bilgilerini al
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `${symbol} için açık pozisyon bulunamadı` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const quantity = Math.abs(positionAmt);
    
    // Take Profit emri oluştur
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'TAKE_PROFIT_MARKET',
      stopPrice: price,
      closePosition: true,
      workingType: 'MARK_PRICE'
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      stopPrice: order.stopPrice,
      message: `Take Profit emri oluşturuldu: ${symbol} @ ${price}`
    });
  } catch (error) {
    console.error('Take Profit eklerken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop Entry ekle (Entry fiyatına stop market emri)
router.post('/stop-entry', async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Sembol belirtilmedi' });
    }
    
    // API anahtarlarının geçerliliğini kontrol et
    if (!hasValidAPIKeys) {
      return res.status(403).json({ 
        error: 'Geçerli API anahtarları yapılandırılmadı. Lütfen .env dosyasını kontrol edin.' 
      });
    }
    
    // Pozisyon bilgilerini al
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `${symbol} için açık pozisyon bulunamadı` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const entryPrice = parseFloat(position.entryPrice);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    
    // Eğer miktar belirtilmişse onu kullan, aksi takdirde tüm pozisyonu kapat
    const orderQuantity = quantity ? parseFloat(quantity) : Math.abs(positionAmt);
    
    // Sembol için doğru hassasiyet değerini al
    const precision = await getSymbolPrecision(symbol);
    
    console.log(`Stop Entry emri oluşturuluyor: ${symbol}, Entry Fiyatı: ${entryPrice}, Miktar: ${orderQuantity}, Hassasiyet: ${precision}`);
    
    // Stop Entry emri oluştur (entry fiyatına stop market emri)
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'STOP_MARKET',
      stopPrice: entryPrice.toString(),
      quantity: orderQuantity.toFixed(precision),
      workingType: 'MARK_PRICE'
    });
    
    console.log('Oluşturulan Stop Entry emri:', JSON.stringify(order));
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      stopPrice: entryPrice,
      quantity: orderQuantity,
      message: `Entry fiyatına (${entryPrice}) stop market emri oluşturuldu: ${symbol}`
    });
  } catch (error) {
    console.error('Stop Entry eklerken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kısmi pozisyon kapatma (Market)
router.post('/close-partial', async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    
    if (!symbol || !quantity) {
      return res.status(400).json({ error: 'Sembol veya miktar belirtilmedi' });
    }
    
    // API anahtarlarının geçerliliğini kontrol et
    if (!hasValidAPIKeys) {
      return res.status(403).json({ 
        error: 'Geçerli API anahtarları yapılandırılmadı. Lütfen .env dosyasını kontrol edin.' 
      });
    }
    
    // Pozisyon bilgilerini al
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `${symbol} için açık pozisyon bulunamadı` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const totalQuantity = Math.abs(positionAmt);
    
    // Kapatılacak miktar, toplam pozisyon miktarından büyük olmamalı
    if (parseFloat(quantity) > totalQuantity) {
      return res.status(400).json({ 
        error: `Kapatılacak miktar (${quantity}), toplam pozisyon miktarından (${totalQuantity}) büyük olamaz` 
      });
    }
    
    // Sembol için doğru hassasiyet değerini al
    const precision = await getSymbolPrecision(symbol);
    
    console.log(`Kısmi pozisyon kapatılıyor: ${symbol}, Miktar: ${quantity}, Hassasiyet: ${precision}`);
    
    // Market emri ile kapat
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'MARKET',
      quantity: parseFloat(quantity).toFixed(precision),
      reduceOnly: true
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      price: order.price,
      quantity: order.origQty,
      message: `Kısmi pozisyon kapatıldı: ${symbol}, Miktar: ${quantity}`
    });
  } catch (error) {
    console.error('Kısmi pozisyon kapatma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Limit emir ile pozisyon kapatma
router.post('/limit-close', async (req, res) => {
  try {
    const { symbol, price, quantity } = req.body;
    
    if (!symbol || !price || !quantity) {
      return res.status(400).json({ error: 'Sembol, fiyat veya miktar belirtilmedi' });
    }
    
    // API anahtarlarının geçerliliğini kontrol et
    if (!hasValidAPIKeys) {
      return res.status(403).json({ 
        error: 'Geçerli API anahtarları yapılandırılmadı. Lütfen .env dosyasını kontrol edin.' 
      });
    }
    
    // Pozisyon bilgilerini al
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `${symbol} için açık pozisyon bulunamadı` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const totalQuantity = Math.abs(positionAmt);
    
    // Kapatılacak miktar, toplam pozisyon miktarından büyük olmamalı
    if (parseFloat(quantity) > totalQuantity) {
      return res.status(400).json({ 
        error: `Kapatılacak miktar (${quantity}), toplam pozisyon miktarından (${totalQuantity}) büyük olamaz` 
      });
    }
    
    // Sembol için doğru hassasiyet değerini al
    const precision = await getSymbolPrecision(symbol);
    
    console.log(`Limit emir ile pozisyon kapatılıyor: ${symbol}, Fiyat: ${price}, Miktar: ${quantity}, Hassasiyet: ${precision}`);
    
    // Limit emri oluştur
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'LIMIT',
      price: price,
      quantity: parseFloat(quantity).toFixed(precision),
      timeInForce: 'GTC',
      reduceOnly: true
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      price: order.price,
      quantity: order.origQty,
      message: `Limit emir oluşturuldu: ${symbol} @ ${price}, Miktar: ${quantity}`
    });
  } catch (error) {
    console.error('Limit emir oluşturma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop Loss emri ile pozisyon kapatma (belirli miktar için)
router.post('/stop-loss-partial', async (req, res) => {
  try {
    const { symbol, price, quantity } = req.body;
    
    if (!symbol || !price || !quantity) {
      return res.status(400).json({ error: 'Sembol, fiyat veya miktar belirtilmedi' });
    }
    
    // API anahtarlarının geçerliliğini kontrol et
    if (!hasValidAPIKeys) {
      return res.status(403).json({ 
        error: 'Geçerli API anahtarları yapılandırılmadı. Lütfen .env dosyasını kontrol edin.' 
      });
    }
    
    // Pozisyon bilgilerini al
    const positions = await binanceClient.futuresPositionRisk({ symbol });
    
    if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
      return res.status(404).json({ error: `${symbol} için açık pozisyon bulunamadı` });
    }
    
    const position = positions[0];
    const positionAmt = parseFloat(position.positionAmt);
    const side = positionAmt > 0 ? 'SELL' : 'BUY';
    const totalQuantity = Math.abs(positionAmt);
    
    // Kapatılacak miktar, toplam pozisyon miktarından büyük olmamalı
    if (parseFloat(quantity) > totalQuantity) {
      return res.status(400).json({ 
        error: `Kapatılacak miktar (${quantity}), toplam pozisyon miktarından (${totalQuantity}) büyük olamaz` 
      });
    }
    
    // Sembol için doğru hassasiyet değerini al
    const precision = await getSymbolPrecision(symbol);
    
    console.log(`Stop Loss emri oluşturuluyor: ${symbol}, Fiyat: ${price}, Miktar: ${quantity}, Hassasiyet: ${precision}`);
    
    // Stop Loss emri oluştur
    const order = await binanceClient.futuresOrder({
      symbol: symbol,
      side: side,
      type: 'STOP_MARKET',
      stopPrice: price,
      quantity: parseFloat(quantity).toFixed(precision),
      reduceOnly: true,
      workingType: 'MARK_PRICE'
    });
    
    res.json({
      success: true,
      orderId: order.orderId,
      symbol: order.symbol,
      side: order.side,
      stopPrice: order.stopPrice,
      quantity: order.origQty,
      message: `Stop Loss emri oluşturuldu: ${symbol} @ ${price}, Miktar: ${quantity}`
    });
  } catch (error) {
    console.error('Stop Loss emri oluşturma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Açık emirleri getir
router.get('/open-orders', async (req, res) => {
  try {
    console.log('Open Orders API çağrıldı');
    
    // API anahtarlarının geçerliliğini kontrol et
    if (!hasValidAPIKeys) {
      return res.status(403).json({ 
        error: 'Geçerli API anahtarları yapılandırılmadı. Lütfen .env dosyasını kontrol edin.' 
      });
    }
    
    // Tüm açık emirleri getir
    const openOrders = await binanceClient.futuresOpenOrders();
    console.log('Açık Emirler:', JSON.stringify(openOrders));
    
    res.json({ orders: openOrders });
  } catch (error) {
    console.error('Açık emirler alınırken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Emri iptal et
router.post('/cancel-order', async (req, res) => {
  try {
    const { symbol, orderId } = req.body;
    
    if (!symbol || !orderId) {
      return res.status(400).json({ error: 'Sembol veya emir ID belirtilmedi' });
    }
    
    // API anahtarlarının geçerliliğini kontrol et
    if (!hasValidAPIKeys) {
      return res.status(403).json({ 
        error: 'Geçerli API anahtarları yapılandırılmadı. Lütfen .env dosyasını kontrol edin.' 
      });
    }
    
    // Emri iptal et
    const result = await binanceClient.futuresCancelOrder({
      symbol: symbol,
      orderId: orderId
    });
    
    res.json({
      success: true,
      orderId: result.orderId,
      symbol: result.symbol,
      status: result.status,
      message: `Emir iptal edildi: ${symbol}, Emir ID: ${orderId}`
    });
  } catch (error) {
    console.error('Emir iptal edilirken hata:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 