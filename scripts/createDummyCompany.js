const mongoose = require('mongoose');
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

// Create dummy company
const createDummyCompany = async () => {
    try {
        // Check if company already exists
        const existingCompany = await Company.findOne({ emailDomain: 'kashmirevents.com' });
        if (existingCompany) {
            console.log('❌ Company already exists with domain kashmirevents.com');
            console.log('📋 Company Details:');
            console.log(`   Name: ${existingCompany.name}`);
            console.log(`   Domain: ${existingCompany.emailDomain}`);
            console.log(`   Company Key: ${existingCompany.companyKey}`);
            console.log(`   Max Admins: ${existingCompany.maxAdmins}`);
            console.log(`   Contact: ${existingCompany.contactEmail}`);
            return;
        }

        // Create new dummy company
        const dummyCompany = new Company({
            name: 'Kashmir Events Management',
            emailDomain: 'kashmirevents.com',
            companyKey: 'KASHMIR2026EVENTS',
            maxAdmins: 5,
            contactEmail: 'ABCD@kashmirevents.com',
            description: 'Premier event management company serving the beautiful Kashmir Valley. We organize cultural, social, and business events throughout the region.',
            address: 'Srinagar, Kashmir Valley, India',
            isActive: true
        });

        await dummyCompany.save();

        console.log('✅ Dummy company created successfully!');
        console.log('📋 Company Details:');
        console.log(`   Name: ${dummyCompany.name}`);
        console.log(`   Email Domain: ${dummyCompany.emailDomain}`);
        console.log(`   Company Key: ${dummyCompany.companyKey}`);
        console.log(`   Max Admins: ${dummyCompany.maxAdmins}`);
        console.log(`   Contact Email: ${dummyCompany.contactEmail}`);
        console.log(`   Description: ${dummyCompany.description}`);
        
        console.log('\n🎯 HOW TO USE:');
        console.log('1. For Admin Access: Register with email ABCD@kashmirevents.com and company key: KASHMIR2026EVENTS');
        console.log('2. For Customer Access: Register with any other email (like personal@gmail.com)');
        console.log('3. Company employees can use any email @kashmirevents.com domain with the company key for admin access');

    } catch (error) {
        console.error('❌ Error creating dummy company:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

// Run the script
const main = async () => {
    await connectDB();
    await createDummyCompany();
};

main().catch(console.error);
