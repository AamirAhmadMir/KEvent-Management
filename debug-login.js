const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Debug login functionality
const debugLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-management');
        console.log('✅ Connected to database');

        // Find admin user
        const adminUser = await User.findByEmail('admin@eventmgmt.com');
        
        if (adminUser) {
            console.log('\n🔍 Found admin user:');
            console.log(`Name: ${adminUser.name}`);
            console.log(`Email: ${adminUser.email}`);
            console.log(`Role: ${adminUser.role}`);
            console.log(`Password exists: ${!!adminUser.password}`);
            console.log(`Password length: ${adminUser.password.length}`);
            
            // Test password comparison
            const isMatch = await adminUser.comparePassword('admin123');
            console.log(`Password comparison (admin123): ${isMatch}`);
            
            // Test with wrong password
            const isWrongMatch = await adminUser.comparePassword('wrongpassword');
            console.log(`Password comparison (wrongpassword): ${isWrongMatch}`);
            
        } else {
            console.log('❌ Admin user not found');
        }

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error debugging login:', error);
        process.exit(1);
    }
};

debugLogin();
