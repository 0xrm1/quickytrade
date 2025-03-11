/**
 * routes.js
 * 
 * Binance API mikroservisi rotaları.
 * Bu dosya, Binance API ile ilgili tüm rotaları tanımlar.
 */

const express = require('express');
const controllers = require('./controllers');

const router = express.Router();

// Ticker rotaları
router.get('/ticker/:symbol', controllers.getTicker);
router.get('/tickers', controllers.getTickers);

// Kline rotaları
router.get('/klines/:symbol', controllers.getKlines);

// Market rotaları
router.get('/market/:symbol', controllers.getMarket);

// Derinlik rotaları
router.get('/depth/:symbol', controllers.getDepth);

// İşlem rotaları
router.get('/trades/:symbol', controllers.getTrades);

// Borsa bilgisi rotaları
router.get('/exchange-info', controllers.getExchangeInfo);

// Önbellek yönetimi rotaları
router.post('/cache/clear', controllers.clearCache);
router.post('/cache/set-ttl', controllers.setCacheTTL);
router.get('/cache/status', controllers.getCacheStatus);

// Eşik değeri yönetimi rotaları
router.post('/thresholds/set', controllers.setThresholds);
router.get('/thresholds/get', controllers.getThresholds);

 