const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to database and check users
const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-management');
        console.log('✅ Connected to database');

        // Find all users
        const users = await User.find({});
        console.log(`\n📊 Found ${users.length} users in database:`);
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });

        if (users.length === 0) {
            console.log('\n❌ No users found. Registration may have failed.');
        } else {
            console.log('\n✅ Users found in database.');
        }

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error checking users:', error);
        process.exit(1);
    }
};

checkUsers();
