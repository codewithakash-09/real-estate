const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Only connect if MongoDB URI is provided
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ MongoDB Connected');
        } else {
            console.log('⚠️ MongoDB not configured - using in-memory storage');
        }
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;