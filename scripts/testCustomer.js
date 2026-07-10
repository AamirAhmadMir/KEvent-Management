const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-management');
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Create test customer account
const createTestCustomer = async () => {
    try {
        // Check if test customer already exists
        const existingCustomer = await User.findOne({ email: 'emir@example.com' });
        if (existingCustomer) {
            console.log('⚠️  Test customer emir@example.com already exists');
            console.log('🔑 Login Credentials:');
            console.log('   Email: emir@example.com');
            console.log('   Password: emir123');
            return;
        }

        // Create test customer account
        const testCustomer = new User({
            name: 'Emir Khan',
            email: 'emir@example.com',
            password: 'emir123',
            role: 'customer',
            isSocialLogin: false
        });

        await testCustomer.save();

        console.log('✅ Test customer created successfully!');
        console.log('🔑 Login Credentials:');
        console.log('   Email: emir@example.com');
        console.log('   Password: emir123');
        console.log('');
        console.log('🎯 You can now test customer login with these credentials');

    } catch (error) {
        console.error('❌ Error creating test customer:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

// Run the script
const main = async () => {
    await connectDB();
    await createTestCustomer();
};

main().catch(console.error);
