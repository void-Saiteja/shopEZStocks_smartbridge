const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    // Configure a quick timeout (3 seconds) to fail fast and fall back to In-Memory store
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopez-stocks', {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log('===================================================');
    console.log('MongoDB connected successfully.');
    console.log('===================================================');
  } catch (error) {
    isConnected = false;
    console.log('===================================================');
    console.warn('WARNING: MongoDB connection failed.');
    console.warn('Falling back to IN-MEMORY DATABASE.');
    console.warn('The application will be fully functional but data will reset on restart.');
    console.log('===================================================');
  }
};

module.exports = {
  connectDB,
  isConnected: () => isConnected
};
