const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Defines the structure for user accounts in the Event Management System
 * 
 * Fields:
 * - name: User's full name
 * - email: User's email address (unique)
 * - password: Encrypted password
 * - role: User role (admin or customer)
 */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        required: function() {
            // Password is required unless it's a social login user
            return !this.googleId && !this.facebookId;
        },
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: {
            values: ['admin', 'customer'],
            message: 'Role must be either admin or customer'
        },
        default: 'customer'
    },
    // Social login fields
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    isSocialLogin: {
        type: Boolean,
        default: false
    },
    // Company association fields
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: false
    },
    companyKey: {
        type: String,
        required: false
    },
    isCompanyAdmin: {
        type: Boolean,
        default: false
    },
    adminVerifiedAt: {
        type: Date
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

userSchema.pre('save', async function() {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const isBcryptHash = /^\$2[aby]?\$\d+\$/.test(this.password);
    if (isBcryptHash) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
});

/**
 * Instance method to compare passwords during login
 * @param {string} candidatePassword - The password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method to get user information without sensitive data
 * @returns {Object} - User object without password
 */
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

/**
 * Static method to find user by email (useful for authentication)
 * @param {string} email - The email to search for
 * @returns {Promise<Object>} - User document or null
 */
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
