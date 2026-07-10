const Event = require('../models/Event');
const Booking = require('../models/Booking');

const EVENT_FIELDS = 'title date description availableSeats totalSeats';

/**
 * Book seats for an event (Customer only)
 */
const bookEvent = async (req, res) => {
    try {
        const { eventId, numberOfSeats } = req.body;
        const userId = req.user._id;
        const seats = Number(numberOfSeats);

        if (!eventId || !numberOfSeats) {
            return res.status(400).json({
                success: false,
                message: 'Please select an event and specify number of seats'
            });
        }

        if (!Number.isInteger(seats) || seats < 1) {
            return res.status(400).json({
                success: false,
                message: 'Number of seats must be a positive integer'
            });
        }

        const existingBooking = await Booking.findOne({ userId, eventId, status: 'confirmed' });
        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: 'You already have a booking for this event'
            });
        }

        const updatedEvent = await Event.findOneAndUpdate(
            {
                _id: eventId,
                availableSeats: { $gte: seats },
                date: { $gt: new Date() }
            },
            { $inc: { availableSeats: -seats } },
            { new: true }
        );

        if (!updatedEvent) {
            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }
            if (event.date <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'This event has already passed'
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Not enough seats available'
            });
        }

        try {
            const booking = new Booking({
                userId,
                eventId,
                numberOfSeats: seats,
                status: 'confirmed'
            });
            await booking.save();

            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: {
                    booking: {
                        ...booking.toJSON(),
                        event: {
                            id: updatedEvent._id,
                            title: updatedEvent.title,
                            date: updatedEvent.date,
                            description: updatedEvent.description
                        }
                    }
                }
            });
        } catch (saveError) {
            await Event.findByIdAndUpdate(eventId, { $inc: { availableSeats: seats } });
            throw saveError;
        }
    } catch (error) {
        console.error('Book event error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You already have a booking for this event'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error creating booking'
        });
    }
};

/**
 * Cancel a booking (Customer only)
 */
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id;

        if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID'
            });
        }

        const booking = await Booking.findOne({ _id: bookingId, userId });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        booking.status = 'cancelled';
        await booking.save();

        await Event.findByIdAndUpdate(booking.eventId, {
            $inc: { availableSeats: booking.numberOfSeats }
        });

        const populatedBooking = await Booking.findById(booking._id)
            .populate('eventId', EVENT_FIELDS);

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: populatedBooking
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error cancelling booking'
        });
    }
};

/**
 * Get all bookings for authenticated user (Customer only)
 */
const getUserBookings = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, status } = req.query;

        const query = { userId };
        if (status) {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate('eventId', EVENT_FIELDS)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Booking.countDocuments(query);

        res.json({
            success: true,
            data: bookings,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user bookings',
            error: error.message
        });
    }
};

/**
 * Get available events for booking (Customer only)
 */
const getAvailableEvents = async (req, res) => {
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
            message: 'Error fetching available events',
            error: error.message
        });
    }
};

/**
 * Get a specific booking by ID (Customer only)
 */
const getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id;

        if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID'
            });
        }

        const booking = await Booking.findOne({ _id: bookingId, userId })
            .populate('eventId', EVENT_FIELDS);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error retrieving booking'
        });
    }
};

module.exports = {
    bookEvent,
    cancelBooking,
    getUserBookings,
    getAvailableEvents,
    getBookingById
};
