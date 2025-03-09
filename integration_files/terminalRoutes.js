const express = require('express');
const router = express.Router();
const Binance = require('binance-api-node').default;
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config();

// API anahtarlarını kontrol et
// Artık API anahtarlarını sadece kontrol için kullanıyoruz
const hasValidAPIKeys = process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET_KEY && 
                        process.env.BINANCE_API_KEY.length > 5 && 
                        process.env.BINANCE_SECRET_KEY.length > 5 &&
                        process.env.BINANCE_API_KEY !== 'YOUR_API_KEY' &&
                        process.env.BINANCE_SECRET_KEY !== 'YOUR_SECRET_KEY';

console.log('Terminal Routes - API Anahtarları:', {
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

// Terminal komutunu işle
router.post('/execute', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command not specified' });
    }
    
    // Komut geçmişine ekle
    addToHistory(command);
    
    // Komutu analiz et
    const parts = command.trim().split(' ');
    const action = parts[0].toLowerCase();
    
    // API anahtarlarının geçerliliğini kontrol et
    if (!hasValidAPIKeys) {
      return res.status(403).json({ error: 'Valid API keys are not configured. Please check your .env file.' });
    }
    
    // Kısaltılmış komutları işle (l ve s)
    if (action === 'l' || action === 's') {
      if (parts.length < 3) {
        return res.status(400).json({ error: 'Invalid command. Usage: l/s SYMBOL AMOUNT [leverage VALUE]' });
      }
      
      // Sembolü al ve USDT ekle (eğer yoksa)
      let symbol = parts[1].toUpperCase();
      if (!symbol.endsWith('USDT')) {
        symbol += 'USDT';
      }
      
      const amount = parseFloat(parts[2]);
      
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount. Enter a positive number.' });
      }
      
      // Leverage kontrolü
      let leverage = 10; // Varsayılan değer
      if (parts.length >= 5 && parts[3].toLowerCase() === 'leverage') {
        leverage = parseInt(parts[4]);
      }
      
      console.log(`Kısaltılmış komut işleniyor: ${command} -> ${action === 'l' ? 'LONG' : 'SHORT'} ${symbol} ${amount} (${leverage}x)`);
      
      // Leverage ayarla
      await binanceClient.futuresLeverage({
        symbol: symbol,
        leverage: leverage
      });
      
      // Sembol fiyatını al
      const ticker = await binanceClient.futuresDailyStats({ symbol });
      const currentPrice = parseFloat(ticker.lastPrice);
      
      // Sembol için doğru hassasiyet değerini al
      const precision = await getSymbolPrecision(symbol);
      
      // Alınacak miktarı hesapla
      const quantity = amount / currentPrice;
      
      // Doğru hassasiyete göre yuvarla (LOT_SIZE filtresine uymak için)
      const exchangeInfo = await binanceClient.futuresExchangeInfo();
      const symbolInfo = exchangeInfo.symbols.find(s => s.symbol === symbol);
      const lotSizeFilter = symbolInfo.filters.find(filter => filter.filterType === 'LOT_SIZE');
      const stepSize = parseFloat(lotSizeFilter.stepSize);
      const quantityPrecise = Math.floor(quantity / stepSize) * stepSize;
      
      console.log(`Pozisyon açılıyor: ${symbol}, ${amount} USDT, Miktar: ${quantityPrecise}, Hassasiyet: ${precision}, Step Size: ${stepSize}`);
      
      // Market emri gönder
      const order = await binanceClient.futuresOrder({
        symbol: symbol,
        side: action === 'l' ? 'BUY' : 'SELL',
        type: 'MARKET',
        quantity: quantityPrecise.toFixed(precision),
      });
      
      return res.json({
        success: true,
        command: command,
        result: {
          orderId: order.orderId,
          symbol: order.symbol,
          side: order.side,
          price: order.price,
          quantity: order.origQty
        },
        message: `${action === 'l' ? 'LONG' : 'SHORT'} position opened: ${symbol}, ${amount} USDT, ${leverage}x`
      });
    }
    
    // GERÇEK MOD - Binance API ile komutları işle
    if (action === 'open') {
      // Pozisyon açma
      if (parts.length < 4) {
        return res.status(400).json({ error: 'Invalid command. Usage: open long/short SYMBOL AMOUNT' });
      }
      
      const side = parts[1].toLowerCase(); // long veya short
      const symbol = parts[2].toUpperCase(); // örn: BTCUSDT
      const amount = parseFloat(parts[3]); // USDT miktarı
      
      // Geçerlilik kontrolü
      if (side !== 'long' && side !== 'short') {
        return res.status(400).json({ error: 'Invalid direction. Use "long" or "short".' });
      }
      
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount. Enter a positive number.' });
      }
      
      // Leverage ayarla (varsayılan 10x veya komutta belirtilen değer)
      const leverage = parts.length >= 6 && parts[4].toLowerCase() === 'leverage' ? parseInt(parts[5]) : 10;
      
      await binanceClient.futuresLeverage({
        symbol: symbol,
        leverage: leverage
      });
      
      // Sembol fiyatını al
      const ticker = await binanceClient.futuresDailyStats({ symbol });
      const currentPrice = parseFloat(ticker.lastPrice);
      
      // Sembol için doğru hassasiyet değerini al
      const precision = await getSymbolPrecision(symbol);
      
      // Alınacak miktarı hesapla
      const quantity = amount / currentPrice;
      
      // Doğru hassasiyete göre yuvarla (LOT_SIZE filtresine uymak için)
      const exchangeInfo = await binanceClient.futuresExchangeInfo();
      const symbolInfo = exchangeInfo.symbols.find(s => s.symbol === symbol);
      const lotSizeFilter = symbolInfo.filters.find(filter => filter.filterType === 'LOT_SIZE');
      const stepSize = parseFloat(lotSizeFilter.stepSize);
      const quantityPrecise = Math.floor(quantity / stepSize) * stepSize;
      
      console.log(`Pozisyon açılıyor: ${symbol}, ${amount} USDT, Miktar: ${quantityPrecise}, Hassasiyet: ${precision}, Step Size: ${stepSize}`);
      
      // Market emri gönder
      const order = await binanceClient.futuresOrder({
        symbol: symbol,
        side: side === 'long' ? 'BUY' : 'SELL',
        type: 'MARKET',
        quantity: quantityPrecise.toFixed(precision),
      });
      
      return res.json({
        success: true,
        command: command,
        result: {
          orderId: order.orderId,
          symbol: order.symbol,
          side: order.side,
          price: order.price,
          quantity: order.origQty
        },
        message: `${side.toUpperCase()} position opened: ${symbol}, ${amount} USDT, ${leverage}x`
      });
    } 
    else if (action === 'close') {
      // Pozisyon kapatma
      if (parts.length < 2) {
        return res.status(400).json({ error: 'Invalid command. Usage: close SYMBOL' });
      }
      
      const symbol = parts[1].toUpperCase(); // örn: BTCUSDT
      
      // Pozisyon bilgilerini al
      const positions = await binanceClient.futuresPositionRisk({ symbol });
      
      if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
        return res.status(404).json({ error: `No open position found for ${symbol}` });
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
      
      return res.json({
        success: true,
        command: command,
        result: {
          orderId: order.orderId,
          symbol: order.symbol,
          side: order.side,
          price: order.price,
          quantity: order.origQty
        },
        message: `Position closed: ${symbol}`
      });
    }
    else if (action === 'closeall') {
      // Tüm pozisyonları kapat
      const allPositions = await binanceClient.futuresPositionRisk();
      const activePositions = allPositions.filter(p => parseFloat(p.positionAmt) !== 0);
      
      if (activePositions.length === 0) {
        return res.status(404).json({ error: 'No open positions found to close' });
      }
      
      const closedPositions = [];
      
      // Her pozisyonu kapat
      for (const position of activePositions) {
        const side = parseFloat(position.positionAmt) > 0 ? 'SELL' : 'BUY';
        const quantity = Math.abs(parseFloat(position.positionAmt));
        
        // Market emri ile kapat
        const order = await binanceClient.futuresOrder({
          symbol: position.symbol,
          side: side,
          type: 'MARKET',
          quantity: quantity.toFixed(3),
          reduceOnly: true
        });
        
        closedPositions.push({
          symbol: position.symbol,
          side: side,
          quantity: quantity.toFixed(3)
        });
      }
      
      return res.json({
        success: true,
        command: command,
        closedPositions: closedPositions,
        message: `${closedPositions.length} positions closed: ${closedPositions.map(p => p.symbol).join(', ')}`
      });
    }
    else if (action === 'positions') {
      // Tüm pozisyonları listele
      const allPositions = await binanceClient.futuresPositionRisk();
      const activePositions = allPositions.filter(p => parseFloat(p.positionAmt) !== 0);
      
      if (activePositions.length === 0) {
        return res.json({
          success: true,
          command: command,
          positions: [],
          message: 'No open positions found'
        });
      }
      
      // Pozisyonları formatlayarak döndür
      const formattedPositions = activePositions.map(pos => {
        const posAmt = parseFloat(pos.positionAmt);
        const isLong = posAmt > 0;
        const pnl = parseFloat(pos.unRealizedProfit);
        
        return {
          symbol: pos.symbol,
          side: isLong ? 'LONG' : 'SHORT',
          size: Math.abs(posAmt).toFixed(3),
          entryPrice: parseFloat(pos.entryPrice).toFixed(2),
          markPrice: parseFloat(pos.markPrice).toFixed(2),
          pnl: `${pnl > 0 ? '+' : ''}${pnl.toFixed(2)} USDT`,
          liqPrice: parseFloat(pos.liquidationPrice).toFixed(2)
        };
      });
      
      return res.json({
        success: true,
        command: command,
        positions: formattedPositions,
        message: `Found ${formattedPositions.length} open positions`
      });
    }
    else if (action === 'price') {
      // Sembol fiyatını göster
      if (parts.length < 2) {
        return res.status(400).json({ error: 'Invalid command. Usage: price SYMBOL' });
      }
      
      const symbol = parts[1].toUpperCase();
      
      try {
        // Fiyat bilgisini al
        const ticker = await binanceClient.futuresDailyStats({ symbol });
        const price = parseFloat(ticker.lastPrice);
        const priceChange = parseFloat(ticker.priceChangePercent);
        
        return res.json({
          success: true,
          command: command,
          price: {
            symbol: symbol,
            price: price.toFixed(4),
            change: `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`,
            high: parseFloat(ticker.highPrice).toFixed(4),
            low: parseFloat(ticker.lowPrice).toFixed(4)
          },
          message: `${symbol}: ${price.toFixed(4)} (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%)`
        });
      } catch (error) {
        return res.status(404).json({ error: `Sembol bulunamadı: ${symbol}` });
      }
    }
    else if (action === 'help') {
      // Komut yardımı
      return res.json({
        success: true,
        command: command,
        help: {
          open: 'Open position: open long/short SYMBOL AMOUNT [leverage LEVERAGE]',
          l: 'Quick long position: l SYMBOL AMOUNT [leverage LEVERAGE]',
          s: 'Quick short position: s SYMBOL AMOUNT [leverage LEVERAGE]',
          close: 'Close position: close SYMBOL',
          closeall: 'Close all positions: closeall',
          positions: 'List open positions: positions',
          price: 'Show symbol price: price SYMBOL',
          stop: 'Set Stop-Loss: stop SYMBOL PRICE',
          tp: 'Set Take-Profit: tp SYMBOL PRICE',
          balance: 'Account balance: balance',
          help: 'Command help: help'
        },
        message: `Available commands:
- open long/short SYMBOL AMOUNT [leverage LEVERAGE] - Open a new position
- l SYMBOL AMOUNT [leverage LEVERAGE] - Quick long position (USDT added automatically)
- s SYMBOL AMOUNT [leverage LEVERAGE] - Quick short position (USDT added automatically)
- close SYMBOL - Close a specific position
- closeall - Close all open positions
- positions - List all open positions
- price SYMBOL - Show current price for symbol
- stop SYMBOL PRICE - Set stop loss for position
- tp SYMBOL PRICE - Set take profit for position
- balance - Show account balance
- help - Show available commands`
      });
    }
    else if (action === 'balance') {
      // Hesap bakiyesi
      const account = await binanceClient.futuresAccountBalance();
      const usdt = account.find(a => a.asset === 'USDT');
      
      return res.json({
        success: true,
        command: command,
        balance: {
          asset: usdt.asset,
          balance: usdt.balance,
          availableBalance: usdt.availableBalance
        },
        message: `Balance: ${usdt.availableBalance} USDT`
      });
    }
    else if (action === 'stop') {
      // Stop loss ayarla
      if (parts.length < 3) {
        return res.status(400).json({ error: 'Invalid command. Usage: stop SYMBOL PRICE' });
      }
      
      const symbol = parts[1].toUpperCase();
      const price = parseFloat(parts[2]);
      
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ error: 'Geçersiz fiyat. Pozitif bir sayı girin.' });
      }
      
      // Pozisyon bilgilerini al
      const positions = await binanceClient.futuresPositionRisk({ symbol });
      
      if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
        return res.status(404).json({ error: `No open position found for ${symbol}` });
      }
      
      const position = positions[0];
      const positionAmt = parseFloat(position.positionAmt);
      const side = positionAmt > 0 ? 'SELL' : 'BUY';
      
      // Stop Loss emri oluştur
      const order = await binanceClient.futuresOrder({
        symbol: symbol,
        side: side,
        type: 'STOP_MARKET',
        stopPrice: price,
        closePosition: true,
        workingType: 'MARK_PRICE'
      });
      
      return res.json({
        success: true,
        command: command,
        result: {
          orderId: order.orderId,
          symbol: order.symbol,
          side: order.side,
          stopPrice: order.stopPrice
        },
        message: `Stop Loss order created: ${symbol} @ ${price}`
      });
    }
    else if (action === 'tp') {
      // Take profit ayarla
      if (parts.length < 3) {
        return res.status(400).json({ error: 'Invalid command. Usage: tp SYMBOL PRICE' });
      }
      
      const symbol = parts[1].toUpperCase();
      const price = parseFloat(parts[2]);
      
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ error: 'Geçersiz fiyat. Pozitif bir sayı girin.' });
      }
      
      // Pozisyon bilgilerini al
      const positions = await binanceClient.futuresPositionRisk({ symbol });
      
      if (positions.length === 0 || parseFloat(positions[0].positionAmt) === 0) {
        return res.status(404).json({ error: `No open position found for ${symbol}` });
      }
      
      const position = positions[0];
      const positionAmt = parseFloat(position.positionAmt);
      const side = positionAmt > 0 ? 'SELL' : 'BUY';
      
      // Take Profit emri oluştur
      const order = await binanceClient.futuresOrder({
        symbol: symbol,
        side: side,
        type: 'TAKE_PROFIT_MARKET',
        stopPrice: price,
        closePosition: true,
        workingType: 'MARK_PRICE'
      });
      
      return res.json({
        success: true,
        command: command,
        result: {
          orderId: order.orderId,
          symbol: order.symbol,
          side: order.side,
          stopPrice: order.stopPrice
        },
        message: `Take Profit order created: ${symbol} @ ${price}`
      });
    }
    else if (action === 'leverage') {
      // Kaldıraç ayarla
      if (parts.length < 3) {
        return res.status(400).json({ error: 'Invalid command. Usage: leverage SYMBOL VALUE' });
      }
      
      const symbol = parts[1].toUpperCase();
      const leverage = parseInt(parts[2]);
      
      if (isNaN(leverage) || leverage < 1 || leverage > 125) {
        return res.status(400).json({ error: 'Invalid leverage value. Enter a value between 1-125.' });
      }
      
      // Kaldıracı ayarla
      const result = await binanceClient.futuresLeverage({
        symbol: symbol,
        leverage: leverage
      });
      
      return res.json({
        success: true,
        command: command,
        result: {
          symbol: result.symbol,
          leverage: result.leverage
        },
        message: `Leverage updated: ${symbol} ${leverage}x`
      });
    }
    else {
      return res.status(400).json({ 
        error: 'Unknown command. Available commands: open, l, s, close, closeall, positions, price, stop, tp, leverage, balance, help',
        command: command
      });
    }
  } catch (error) {
    console.error('Terminal komut hatası:', error);
    res.status(500).json({ 
      error: error.message,
      command: req.body.command
    });
  }
});

// Terminal komut geçmişi
let commandHistory = [];

// Komut geçmişini al
router.get('/history', (req, res) => {
  res.json({ history: commandHistory });
});

// Komut geçmişine ekle
function addToHistory(command, result = null) {
  // Geçmişe ekle (en fazla 100 komut saklansın)
  commandHistory.unshift({
    command,
    result,
    timestamp: Date.now()
  });
  
  // En fazla 100 komut sakla
  if (commandHistory.length > 100) {
    commandHistory = commandHistory.slice(0, 100);
  }
}

// Komut geçmişine ekle (API endpointi)
router.post('/history', (req, res) => {
  const { command, result } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Komut belirtilmedi' });
  }
  
  addToHistory(command, result);
  
  res.json({ success: true });
});

module.exports = router; 