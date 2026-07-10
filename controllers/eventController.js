const Event = require('../models/Event');

/**
 * Event Controller
 * Handles the business logic for event management (Admin operations)
 * 
 * Functions:
 * - createEvent: Create a new event
 * - getAllEvents: Get all events (admin view)
 * - getEventById: Get a single event by ID
 * - updateEvent: Update an existing event
 * - deleteEvent: Delete an event
 * - getEventStats: Get event statistics
 */

/**
 * Create a new event (Admin only)
 * Creates a new event with automatic seat management
 */
const createEvent = async (req, res) => {
    try {
        const { title, description, date, totalSeats } = req.body;
        
        console.log('Creating event with data:', { title, description, date, totalSeats });

        // Validate required fields
        if (!title || !description || !date || !totalSeats) {
            console.log('Validation failed - missing fields:', { title: !!title, description: !!description, date: !!date, totalSeats: !!totalSeats });
            return res.status(400).json({
                success: false,
                message: 'Please provide event title, description, date, and total seats'
            });
        }

        // Validate totalSeats is a positive number
        if (totalSeats <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Total seats must be a positive number'
            });
        }

        // Parse and validate date
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        // Check if event date is in the future
        if (eventDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Event date must be scheduled for a future time'
            });
        }

        // Create new event
        const event = new Event({
            title: title.trim(),
            description: description.trim(),
            date: eventDate,
            totalSeats: Number(totalSeats),
            availableSeats: Number(totalSeats) // Set availableSeats equal to totalSeats
        });

        await event.save();

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: {
                event
            }
        });

    } catch (error) {
        console.error('Create event error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error creating event'
        });
    }
};

/**
 * Get all events (Admin view)
 * Returns all events with detailed information
 */
const getAllEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, sortBy = 'date', sortOrder = 'asc' } = req.query;

        // Build query
        let query = {};
        
        // Filter by status if provided
        if (status) {
            switch (status) {
                case 'upcoming':
                    query.date = { $gt: new Date() };
                    break;
                case 'past':
                    query.date = { $lt: new Date() };
                    break;
                case 'available':
                    query.availableSeats = { $gt: 0 };
                    break;
                case 'fullyBooked':
                    query.availableSeats = 0;
                    break;
            }
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (page - 1) * limit;

        // Execute query
        const events = await Event.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Event.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'Events retrieved successfully',
            data: {
                events,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalEvents: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get all events error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving events'
        });
    }
};

/**
 * Get a single event by ID (Admin view)
 * Returns detailed event information
 */
const getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Event retrieved successfully',
            data: {
                event
            }
        });

    } catch (error) {
        console.error('Get event by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving event'
        });
    }
};

/**
 * Update an existing event (Admin only)
 * Updates event details with validation
 */
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, date, totalSeats } = req.body;

        // Validate ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        // Find the event
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if event has bookings (prevent reducing totalSeats below booked seats)
        const bookedSeats = event.totalSeats - event.availableSeats;
        
        if (totalSeats && totalSeats < bookedSeats) {
            return res.status(400).json({
                success: false,
                message: `Cannot reduce total seats below ${bookedSeats} (already booked)`
            });
        }

        // Prepare update data
        const updateData = {};
        
        if (title) updateData.title = title.trim();
        if (description) updateData.description = description.trim();
        if (date) {
            const eventDate = new Date(date);
            if (isNaN(eventDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format'
                });
            }
            if (eventDate <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Event date must be in the future'
                });
            }
            updateData.date = eventDate;
        }
        
        if (totalSeats) {
            updateData.totalSeats = Number(totalSeats);
            // Update availableSeats proportionally
            const newAvailableSeats = Number(totalSeats) - bookedSeats;
            updateData.availableSeats = Math.max(0, newAvailableSeats);
        }

        // Update the event
        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: {
                event: updatedEvent
            }
        });

    } catch (error) {
        console.error('Update event error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error updating event'
        });
    }
};

/**
 * Delete an event (Admin only)
 * Deletes an event after checking for existing bookings
 */
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if event has bookings
        const bookedSeats = event.totalSeats - event.availableSeats;
        
        // Cancel all bookings for this event before deleting
        if (bookedSeats > 0) {
            const Booking = require('../models/Booking');
            await Booking.updateMany(
                { eventId: id, status: 'confirmed' },
                { 
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancellationReason: 'Event cancelled by admin'
                }
            );
            console.log(`Cancelled all bookings for event ${id}`);
        }

        // Delete the event
        await Event.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        });

    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting event'
        });
    }
};

/**
 * Get all events (Public view)
 * Returns all upcoming events for public display
 */
const getEvents = async (req, res) => {
    try {
        const events = await Event.find({ 
            date: { $gte: new Date() },
            availableSeats: { $gt: 0 }
        })
        .sort({ date: 1 })
        .limit(20);
        
        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching events',
            error: error.message
        });
    }
};

/**
 * Get event statistics (Admin only)
 * Returns comprehensive event statistics
 */
const getEventStats = async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments();
        const upcomingEvents = await Event.countDocuments({ date: { $gt: new Date() } });
        const pastEvents = await Event.countDocuments({ date: { $lt: new Date() } });
        const fullyBookedEvents = await Event.countDocuments({ availableSeats: 0 });
        const availableEvents = await Event.countDocuments({ availableSeats: { $gt: 0 } });

        // Calculate total seats and bookings
        const seatStats = await Event.aggregate([
            {
                $group: {
                    _id: null,
                    totalSeats: { $sum: '$totalSeats' },
                    availableSeats: { $sum: '$availableSeats' },
                    bookedSeats: { $sum: { $subtract: ['$totalSeats', '$availableSeats'] } }
                }
            }
        ]);

        const stats = seatStats[0] || { totalSeats: 0, availableSeats: 0, bookedSeats: 0 };

        res.status(200).json({
            success: true,
            message: 'Event statistics retrieved successfully',
            data: {
                eventCounts: {
                    total: totalEvents,
                    upcoming: upcomingEvents,
                    past: pastEvents,
                    fullyBooked: fullyBookedEvents,
                    available: availableEvents
                },
                seatStats: {
                    totalSeats: stats.totalSeats,
                    availableSeats: stats.availableSeats,
                    bookedSeats: stats.bookedSeats,
                    bookingPercentage: stats.totalSeats > 0 ? 
                        Math.round((stats.bookedSeats / stats.totalSeats) * 100) : 0
                }
            }
        });

    } catch (error) {
        console.error('Get event stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving event statistics'
        });
    }
};

module.exports = {
    createEvent,
    getAllEvents,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getEventStats
};
