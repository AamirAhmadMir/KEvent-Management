const express = require('express');
const router = express.Router();

// Import authentication middleware
const { authenticateToken, requireCustomer } = require('../middleware/auth');

// Import booking controller functions
const {
    bookEvent,
    cancelBooking,
    getUserBookings,
    getAvailableEvents,
    getBookingById
} = require('../controllers/bookingController');

/**
 * Booking Routes (Customer only)
 * Handles customer booking operations
 * 
 * Routes:
 * POST /api/bookings - Book seats for an event (Customer only)
 * GET /api/bookings - Get all bookings for user (Customer only)
 * GET /api/bookings/available - Get available events for booking (Customer only)
 * GET /api/bookings/:bookingId - Get a specific booking (Customer only)
 * DELETE /api/bookings/:bookingId - Cancel a booking (Customer only)
 */

// Book seats for an event - Customer only
router.post('/', authenticateToken, requireCustomer, bookEvent);

// Get all bookings for authenticated user - Customer only
router.get('/', authenticateToken, requireCustomer, getUserBookings);

// Get available events for booking - Customer only
router.get('/available', authenticateToken, requireCustomer, getAvailableEvents);

// Get a specific booking by ID - Customer only
router.get('/:bookingId', authenticateToken, requireCustomer, getBookingById);

// Cancel a booking - Customer only
router.delete('/:bookingId', authenticateToken, requireCustomer, cancelBooking);

module.exports = router;
