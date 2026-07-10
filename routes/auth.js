const express = require('express');
const router = express.Router();

// Import authentication middleware
const { authenticateToken } = require('../middleware/auth');

// Import user controller functions
const { register, login, getProfile } = require('../controllers/authController');

/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 * 
 * Routes:
 * POST /api/auth/register - Register a new user
 * POST /api/auth/login - Login existing user
 * GET /api/auth/profile - Get user profile (protected)
 */

// Registration route - Public access
router.post('/register', register);

// Login route - Public access
router.post('/login', login);

// Get user profile - Protected route (requires authentication)
router.get('/profile', authenticateToken, getProfile);


// Google OAuth routes (temporarily disabled)
// router.get('/google', googleAuth);
// router.get('/google/callback', googleCallback);

// Facebook OAuth routes (temporarily disabled)
// router.get('/facebook', facebookAuth);
// router.get('/facebook/callback', facebookCallback);

module.exports = router;
