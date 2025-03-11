const mongoose = require('mongoose');

module.exports = async () => {
  // Disconnect from MongoDB
  await mongoose.disconnect();

  // Stop MongoDB Memory Server
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
}; 