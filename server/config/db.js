const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI in process.env.MONGO_URI.
 * In production/dev, exits if connection fails. In test, throws error for test runner to handle.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`MongoDB connected: ${conn.connection.host}`);
    }
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (process.env.NODE_ENV === 'test') {
      throw error;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
