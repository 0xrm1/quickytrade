const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

module.exports = async () => {
  // Start MongoDB Memory Server
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Set MongoDB URI for tests
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_URI_TEST = uri;

  // Connect to MongoDB
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Store MongoDB instance
  global.__MONGOD__ = mongod;
}; 