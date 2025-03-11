/**
 * db.js
 * 
 * Auth mikroservisi veritabanı bağlantı dosyası.
 * MongoDB bağlantısını yönetir.
 */

const mongoose = require('mongoose');

// MongoDB bağlantı URL'si
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickytrade-auth';

// Bağlantı seçenekleri
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10
};

// Veritabanına bağlan
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log('MongoDB bağlantısı başarılı');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// Bağlantıyı kapat
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('MongoDB bağlantısı kapatılırken hata:', error);
    process.exit(1);
  }
};

// Bağlantı durumunu izle
mongoose.connection.on('connected', () => {
  console.log('MongoDB bağlantısı kuruldu');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB bağlantısı kesildi');
});

// Uygulama kapanırken bağlantıyı kapat
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

module.exports = { connectDB, closeDB }; 