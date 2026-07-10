const mongoose = require('mongoose');

/**
 * Company Schema
 * Manages company information for admin access control
 */
const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    emailDomain: {
        type: String,
        required: [true, 'Email domain is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid domain (e.g., company.com)']
    },
    companyKey: {
        type: String,
        required: [true, 'Company key is required'],
        unique: true,
        trim: true,
        minlength: [8, 'Company key must be at least 8 characters long'],
        maxlength: [50, 'Company key cannot exceed 50 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    maxAdmins: {
        type: Number,
        default: 10,
        min: [1, 'Maximum admins must be at least 1'],
        max: [100, 'Maximum admins cannot exceed 100']
    },
    currentAdminCount: {
        type: Number,
        default: 0
    },
    contactEmail: {
        type: String,
        required: [true, 'Contact email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    contactPhone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        maxlength: [200, 'Address cannot exceed 200 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster lookups
companySchema.index({ emailDomain: 1 });
companySchema.index({ companyKey: 1 });

// Note: Mongoose automatically handles timestamps with the timestamps: true option

// Static method to find company by email domain
companySchema.statics.findByEmailDomain = function(email) {
    const domain = email.split('@')[1];
    return this.findOne({ emailDomain: domain, isActive: true });
};

// Static method to find company by company key
companySchema.statics.findByCompanyKey = function(companyKey) {
    return this.findOne({ companyKey: companyKey, isActive: true });
};

// Instance method to check if company can add more admins
companySchema.methods.canAddAdmin = function() {
    return this.currentAdminCount < this.maxAdmins;
};

// Instance method to increment admin count
companySchema.methods.incrementAdminCount = function() {
    this.currentAdminCount += 1;
    return this.save();
};

// Instance method to decrement admin count
companySchema.methods.decrementAdminCount = function() {
    if (this.currentAdminCount > 0) {
        this.currentAdminCount -= 1;
        return this.save();
    }
    return Promise.resolve(this);
};

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
