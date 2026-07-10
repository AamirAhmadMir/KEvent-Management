const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 * 
 * This middleware:
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies the token
 * 3. Finds the user associated with the token
 * 4. Attaches user to request object
 * 5. Allows access to protected routes
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user by ID
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // Attach user to request object
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        } else {
            console.error('Authentication error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during authentication.'
            });
        }
    }
};

/**
 * Role-based Authorization Middleware
 * Ensures users have the required role to access certain routes
 * 
 * @param {string} role - The required role ('admin' or 'customer')
 * @returns {Function} - Middleware function that checks user role
 */
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (req.user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `Access denied. ${role} role required.`
            });
        }

        next();
    };
};

/**
 * Admin-only middleware
 * Shortcut for requireRole('admin')
 */
const requireAdmin = requireRole('admin');

/**
 * Customer-only middleware
 * Shortcut for requireRole('customer')
 */
const requireCustomer = requireRole('customer');

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't block access
 * Useful for routes that work both with and without authentication
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (user) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireCustomer,
    optionalAuth
};
