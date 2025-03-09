const express = require('express');
const router = express.Router();

// Hızlı butonları saklamak için geçici bir array (veritabanı entegrasyonu daha sonra yapılabilir)
let quickButtons = [];

// Tüm hızlı butonları getir
router.get('/', (req, res) => {
  res.json({ quickButtons });
});

// Yeni hızlı buton ekle
router.post('/add', (req, res) => {
  const { symbol, amount, side } = req.body;
  
  if (!symbol || !amount || !side) {
    return res.status(400).json({ error: 'Symbol, amount ve side alanları zorunludur' });
  }
  
  // Sembolü büyük harfe çevir
  const formattedSymbol = symbol.toUpperCase();
  
  // Yeni buton oluştur
  const newButton = {
    id: Date.now().toString(), // Basit bir ID oluştur
    symbol: formattedSymbol,
    amount: parseFloat(amount),
    side: side.toLowerCase(), // 'long' veya 'short'
    createdAt: new Date().toISOString()
  };
  
  // Butonu listeye ekle
  quickButtons.push(newButton);
  
  res.status(201).json({ 
    message: 'Hızlı buton başarıyla eklendi', 
    button: newButton 
  });
});

// Hızlı buton sil
router.delete('/remove/:id', (req, res) => {
  const { id } = req.params;
  
  // Buton ID'sini kontrol et
  const buttonIndex = quickButtons.findIndex(button => button.id === id);
  
  if (buttonIndex === -1) {
    return res.status(404).json({ error: 'Buton bulunamadı' });
  }
  
  // Butonu listeden kaldır
  const removedButton = quickButtons.splice(buttonIndex, 1)[0];
  
  res.json({ 
    message: 'Buton başarıyla kaldırıldı', 
    button: removedButton 
  });
});

// Hızlı butonları senkronize et (localStorage'dan gelen veriyi kaydet)
router.post('/sync', (req, res) => {
  const { quickButtons: newButtons } = req.body;
  
  if (Array.isArray(newButtons)) {
    quickButtons = newButtons;
    res.json({ 
      success: true, 
      message: 'Hızlı butonlar başarıyla senkronize edildi' 
    });
  } else {
    res.status(400).json({ error: 'Geçersiz buton formatı' });
  }
});

module.exports = router; 