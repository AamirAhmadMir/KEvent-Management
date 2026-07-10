const express = require('express');
const router = express.Router();

// Import authentication middleware
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Import event controller functions
const {
    createEvent,
    getAllEvents,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getEventStats
} = require('../controllers/eventController');

/**
 * Event Routes (Admin only)
 * Handles all event management operations
 * 
 * Routes:
 * POST /api/events - Create a new event (Admin only)
 * GET /api/events - Get all events with pagination and filtering (Admin only)
 * GET /api/events/stats - Get event statistics (Admin only)
 * GET /api/events/:id - Get a single event by ID (Admin only)
 * PUT /api/events/:id - Update an existing event (Admin only)
 * DELETE /api/events/:id - Delete an event (Admin only)
 */

// Create a new event - Admin only (MUST be before public GET route)
router.post('/', authenticateToken, requireAdmin, createEvent);

// Get all events with pagination and filtering - Admin only
router.get('/admin', authenticateToken, requireAdmin, getAllEvents);

// Get all events (Public view) - MUST be after admin POST route
router.get('/', getEvents);

// Get event statistics - Admin only
router.get('/stats', authenticateToken, requireAdmin, getEventStats);

// Get a single event by ID - Admin only
router.get('/:id', authenticateToken, requireAdmin, getEventById);

// Update an existing event - Admin only
router.put('/:id', authenticateToken, requireAdmin, updateEvent);

// Delete an event - Admin only
router.delete('/:id', authenticateToken, requireAdmin, deleteEvent);

module.exports = router;
