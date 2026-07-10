const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Company = require('../models/Company');
const passport = require('passport');

/**
 * Authentication Controller
 * Handles the business logic for user authentication
 * 
 * Functions:
 * - register: Create new user account
 * - login: Authenticate existing user
 * - getProfile: Get user information
 */

/**
 * Generate JWT Token
 * Creates a JSON Web Token for authenticated users
 * 
 * @param {string} userId - User's MongoDB ID
 * @param {string} role - User's role (admin/customer)
 * @returns {string} - JWT token
 */
const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } // Token expires in 24 hours
    );
};

/**
 * Register a new user
 * Creates a new user account with admin or customer role
 */
const register = async (req, res) => {
    try {
        const { name, email, password, role, companyKey } = req.body;
        
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }
        
        // Validate password
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        // Check if email domain matches a company
        const company = await Company.findByEmailDomain(email);
        let userRole = 'customer';
        let companyId = null;
        let isCompanyAdmin = false;
        let adminVerifiedAt = null;
        
        if (company) {
            // User's email domain matches a company
            if (companyKey && companyKey === company.companyKey) {
                // Valid company key provided - this is a company admin
                if (!company.canAddAdmin()) {
                    return res.status(400).json({
                        success: false,
                        message: 'This company has reached its maximum admin limit'
                    });
                }
                
                userRole = 'admin';
                companyId = company._id;
                isCompanyAdmin = true;
                adminVerifiedAt = new Date();
                
                // Increment company's admin count
                await company.incrementAdminCount();
            } else {
                // Email domain matches but no valid company key - regular customer
                companyId = company._id;
                userRole = 'customer';
            }
        }
        
        // Create new user
        const newUser = new User({
            name,
            email,
            password,
            role: userRole,
            companyId,
            companyKey: isCompanyAdmin ? companyKey : null,
            isCompanyAdmin,
            adminVerifiedAt
        });
        
        await newUser.save();

        const token = generateToken(newUser._id, newUser.role);
        
        const responseMessage = isCompanyAdmin 
            ? 'Admin registration successful! You have been granted admin access.'
            : 'User registered successfully';
        
        res.status(201).json({
            success: true,
            message: responseMessage,
            data: {
                user: newUser.toJSON(),
                token
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);

        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

/**
 * Login existing user
 * Authenticates user with email and password
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password'
            });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(), // Removes password automatically
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

/**
 * Get user profile
 * Returns authenticated user's information
 */
const getProfile = async (req, res) => {
    try {
        // User is already attached to request by authentication middleware
        res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: {
                user: req.user.toJSON()
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
};

// Google OAuth routes (temporarily disabled)
// const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

// const googleCallback = passport.authenticate('google', { 
//     failureRedirect: '/login.html',
//     successRedirect: '/customer-dashboard.html'
// });

// Facebook OAuth routes (temporarily disabled)
// const facebookAuth = passport.authenticate('facebook', { scope: ['email'] });

// const facebookCallback = passport.authenticate('facebook', { 
//     failureRedirect: '/login.html',
//     successRedirect: '/customer-dashboard.html'
// });


module.exports = {
    register,
    login,
    getProfile
    // googleAuth,
    // googleCallback,
    // facebookAuth,
    // facebookCallback
};
