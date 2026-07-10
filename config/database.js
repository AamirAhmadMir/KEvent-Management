const mongoose = require('mongoose');

/**
 * Database Configuration
 * Handles MongoDB connection setup
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-management');
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        
        return conn;
    } catch (error) {
        console.error('❌ Database Connection Error:', error.message);
        process.exit(1);
    }
};

/**
 * Graceful database disconnection
 */
const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('📴 MongoDB disconnected');
    } catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error.message);
    }
};

module.exports = { connectDB, disconnectDB };
