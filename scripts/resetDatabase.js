const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Company');
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

// Clear all data and create final admin accounts
const resetDatabase = async () => {
    try {
        console.log('🗑️  Clearing all existing data...');
        
        // Clear all collections
        await User.deleteMany({});
        await Company.deleteMany({});
        
        console.log('✅ Database cleared successfully');
        
        // Create the company
        const company = new Company({
            name: 'Kashmir Events Management',
            emailDomain: 'kashmirevents.com',
            companyKey: 'KASHMIR2026EVENTS',
            maxAdmins: 3,
            contactEmail: 'emir@kashmirevents.com',
            description: 'Premier event management company serving the beautiful Kashmir Valley. We organize cultural, social, and business events throughout the region.',
            address: 'Srinagar, Kashmir Valley, India',
            isActive: true
        });

        await company.save();
        console.log('✅ Company created: Kashmir Events Management');

        // Create final admin accounts
        const admins = [
            {
                name: 'Suhail',
                email: 'suhail@kashmirevents.com',
                password: 'suhail123',
                companyKey: 'KASHMIR2026EVENTS'
            },
            {
                name: 'Aamir',
                email: 'aamir@kashmirevents.com',
                password: 'aamir123',
                companyKey: 'KASHMIR2026EVENTS'
            },
            {
                name: 'Mohsin',
                email: 'mohsin@kashmirevents.com',
                password: 'mohsin123',
                companyKey: 'KASHMIR2026EVENTS'
            }
        ];

        for (const adminData of admins) {
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            
            const newAdmin = new User({
                name: adminData.name,
                email: adminData.email,
                password: hashedPassword,
                role: 'admin',
                companyId: company._id,
                companyKey: adminData.companyKey,
                isCompanyAdmin: true,
                adminVerifiedAt: new Date(),
                isSocialLogin: false
            });

            await newAdmin.save();
            await company.incrementAdminCount();
            
            console.log(`✅ Admin created: ${adminData.name} (${adminData.email})`);
        }

        // Create test customer account
        const customerHashedPassword = await bcrypt.hash('emir123', 10);
        const testCustomer = new User({
            name: 'Emir',
            email: 'emir@example.com',
            password: customerHashedPassword,
            role: 'customer',
            isSocialLogin: false
        });

        await testCustomer.save();
        console.log('✅ Test customer created: emir@example.com');

        // Show final credentials
        console.log('\n🎯 FINAL ADMIN CREDENTIALS (DO NOT CHANGE):');
        console.log('===========================================');
        console.log('1. Suhail');
        console.log('   Email: suhail@kashmirevents.com');
        console.log('   Password: suhail123');
        console.log('');
        console.log('2. Aamir');
        console.log('   Email: aamir@kashmirevents.com');
        console.log('   Password: aamir123');
        console.log('');
        console.log('3. Mohsin');
        console.log('   Email: mohsin@kashmirevents.com');
        console.log('   Password: mohsin123');
        console.log('');
        console.log('🔑 Company Key: KASHMIR2026EVENTS');
        console.log('');
        console.log('👤 Test Customer Account:');
        console.log('   Email: emir@example.com');
        console.log('   Password: emir123');
        console.log('');
        console.log('📊 Company Stats:');
        console.log(`   Admin Count: ${company.currentAdminCount}/${company.maxAdmins}`);

    } catch (error) {
        console.error('❌ Error resetting database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

// Run the script
const main = async () => {
    await connectDB();
    await resetDatabase();
};

main().catch(console.error);
