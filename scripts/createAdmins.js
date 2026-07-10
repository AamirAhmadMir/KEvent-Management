const mongoose = require('mongoose');
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

// Create three admin accounts
const createAdminAccounts = async () => {
    try {
        // Find the Kashmir Events company
        const company = await Company.findOne({ emailDomain: 'kashmirevents.com' });
        if (!company) {
            console.log('❌ Company not found. Please create the company first.');
            return;
        }

        console.log(`📋 Found company: ${company.name}`);
        console.log(`📋 Current admin count: ${company.currentAdminCount}/${company.maxAdmins}`);

        // Admin accounts to create
        const admins = [
            {
                name: 'Suhail Ahmed',
                email: 'suhail@kashmirevents.com',
                password: 'suhail123',
                companyKey: 'KASHMIR2026EVENTS'
            },
            {
                name: 'Aamir Khan',
                email: 'aamir@kashmirevents.com',
                password: 'aamir123',
                companyKey: 'KASHMIR2026EVENTS'
            },
            {
                name: 'Mohsin Yousuf',
                email: 'mohsin@kashmirevents.com',
                password: 'mohsin123',
                companyKey: 'KASHMIR2026EVENTS'
            }
        ];

        for (const adminData of admins) {
            // Check if admin already exists
            const existingAdmin = await User.findOne({ email: adminData.email });
            if (existingAdmin) {
                console.log(`⚠️  Admin ${adminData.email} already exists`);
                console.log(`   Name: ${existingAdmin.name}`);
                console.log(`   Role: ${existingAdmin.role}`);
                console.log(`   Is Company Admin: ${existingAdmin.isCompanyAdmin}`);
                continue;
            }

            // Create new admin
            const newAdmin = new User({
                name: adminData.name,
                email: adminData.email,
                password: adminData.password,
                role: 'admin',
                companyId: company._id,
                companyKey: adminData.companyKey,
                isCompanyAdmin: true,
                adminVerifiedAt: new Date(),
                isSocialLogin: false
            });

            await newAdmin.save();
            
            // Increment company admin count
            await company.incrementAdminCount();

            console.log(`✅ Admin created successfully:`);
            console.log(`   Name: ${newAdmin.name}`);
            console.log(`   Email: ${newAdmin.email}`);
            console.log(`   Password: ${adminData.password}`);
            console.log(`   Role: ${newAdmin.role}`);
            console.log(`   Is Company Admin: ${newAdmin.isCompanyAdmin}`);
            console.log('');
        }

        // Show updated company stats
        const updatedCompany = await Company.findOne({ emailDomain: 'kashmirevents.com' });
        console.log(`📊 Updated Company Stats:`);
        console.log(`   Company: ${updatedCompany.name}`);
        console.log(`   Admin Count: ${updatedCompany.currentAdminCount}/${updatedCompany.maxAdmins}`);
        console.log(`   Company Key: ${updatedCompany.companyKey}`);
        
        console.log('\n🎯 ADMIN LOGIN CREDENTIALS:');
        console.log('1. Suhail Ahmed');
        console.log('   Email: suhail@kashmirevents.com');
        console.log('   Password: suhail123');
        console.log('');
        console.log('2. Aamir Khan');
        console.log('   Email: aamir@kashmirevents.com');
        console.log('   Password: aamir123');
        console.log('');
        console.log('3. Mohsin Yousuf');
        console.log('   Email: mohsin@kashmirevents.com');
        console.log('   Password: mohsin123');
        console.log('');
        console.log('🔑 Company Key for all: KASHMIR2026EVENTS');

    } catch (error) {
        console.error('❌ Error creating admin accounts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

// Run the script
const main = async () => {
    await connectDB();
    await createAdminAccounts();
};

main().catch(console.error);
