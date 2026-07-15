const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('[db] MONGODB_URI is not set. Add it to server/.env to connect.');
      return;
    }
    const conn = await mongoose.connect(uri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[db] Connection error: ${err.message}`);
  }
};

module.exports = connectDB;
