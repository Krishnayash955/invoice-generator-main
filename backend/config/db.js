const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    // Use MongoDB Atlas connection string from environment variables
    // If not available, use a default connection string for development
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb+srv://demo:demo123@cluster0.mongodb.net/invoice-generator?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    // If MongoDB connection fails, we'll fall back to in-memory database
    console.log('Falling back to in-memory database');
    return false;
  }
};

module.exports = connectDB;