const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const EVENT_FIELDS = 'title date description availableSeats totalSeats';

async function cancelBookingAndRestoreSeats(booking, reason, cancelledBy) {
    if (booking.status === 'cancelled') {
        return { alreadyCancelled: true };
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by admin';
    await booking.save();

    await Event.findByIdAndUpdate(booking.eventId, {
        $inc: { availableSeats: booking.numberOfSeats }
    });

    return { alreadyCancelled: false };
}

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, status, eventId } = req.query;

        const query = {};
        if (status) query.status = status;
        if (eventId) query.eventId = eventId;

        const bookings = await Booking.find(query)
            .populate('userId', 'name email')
            .populate('eventId', EVENT_FIELDS)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Booking.countDocuments(query);

        res.json({
            success: true,
            data: {
                bookings,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving bookings'
        });
    }
});

router.get('/event/:eventId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        const bookings = await Booking.find({ eventId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Booking.countDocuments({ eventId });

        res.json({
            success: true,
            data: {
                bookings,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get event bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving event bookings'
        });
    }
});

router.delete('/:bookingId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { bookingId } = req.params;

        if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID'
            });
        }

        const booking = await Booking.findById(bookingId).populate('userId eventId');
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const result = await cancelBookingAndRestoreSeats(
            booking,
            req.body.reason || 'Cancelled by admin',
            req.user._id
        );

        if (result.alreadyCancelled) {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error cancelling booking'
        });
    }
});

router.post('/cancel/:bookingId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reason } = req.body;

        if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID'
            });
        }

        const booking = await Booking.findById(bookingId).populate('userId eventId');
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const result = await cancelBookingAndRestoreSeats(
            booking,
            reason || 'Cancelled by admin',
            req.user._id
        );

        if (result.alreadyCancelled) {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking
        });
    } catch (error) {
        console.error('Force cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error cancelling booking'
        });
    }
});

module.exports = router;
