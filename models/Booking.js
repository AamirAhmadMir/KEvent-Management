const mongoose = require('mongoose');

/**
 * Booking Schema
 * Defines the structure for bookings in the Event Management System
 * 
 * Fields:
 * - userId: ID of the user who made the booking
 * - eventId: ID of the event being booked
 * - numberOfSeats: Number of seats booked
 * - bookingDate: Date when the booking was made
 */
const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'User ID is required'],
        ref: 'User',
        validate: {
            validator: async function(value) {
                const user = await mongoose.model('User').findById(value);
                return user !== null;
            },
            message: 'User not found'
        }
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Event ID is required'],
        ref: 'Event',
        validate: {
            validator: async function(value) {
                const event = await mongoose.model('Event').findById(value);
                return event !== null;
            },
            message: 'Event not found'
        }
    },
    numberOfSeats: {
        type: Number,
        required: [true, 'Number of seats is required'],
        min: [1, 'Must book at least 1 seat'],
        max: [50, 'Cannot book more than 50 seats at once']
    },
    bookingDate: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'cancelled'],
        default: 'confirmed'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

/**
 * Compound index to prevent duplicate bookings for the same user and event
 */
bookingSchema.index({ userId: 1, eventId: 1 }, { unique: true });

/**
 * Note: Seat availability validation and seat reduction will be handled
 * in the controller to avoid middleware issues
 */

/**
 * Note: Seat restoration on cancellation will be handled
 * in the controller to avoid middleware issues
 */

/**
 * Instance method to cancel a booking
 * Updates booking status and restores seats
 */
bookingSchema.methods.cancelBooking = async function() {
    if (this.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
    }
    
    try {
        const Event = mongoose.model('Event');
        const event = await Event.findById(this.eventId);
        
        if (event) {
            // Restore available seats
            event.cancelBooking(this.numberOfSeats);
            await event.save();
        }
        
        // Update booking status
        this.status = 'cancelled';
        await this.save();
        
        return true;
    } catch (error) {
        throw new Error('Failed to cancel booking: ' + error.message);
    }
};

/**
 * Static method to find bookings by user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of user bookings
 */
bookingSchema.statics.findByUser = function(userId) {
    return this.find({ userId, status: 'confirmed' })
        .populate('eventId', 'title date description totalSeats availableSeats')
        .sort({ bookingDate: -1 });
};

/**
 * Static method to find bookings by event
 * @param {string} eventId - Event ID
 * @returns {Promise<Array>} - Array of event bookings
 */
bookingSchema.statics.findByEvent = function(eventId) {
    return this.find({ eventId, status: 'confirmed' })
        .populate('userId', 'name email')
        .sort({ bookingDate: -1 });
};

/**
 * Static method to get booking statistics
 * @returns {Promise<Object>} - Booking statistics
 */
bookingSchema.statics.getStats = async function() {
    const totalBookings = await this.countDocuments({ status: 'confirmed' });
    const cancelledBookings = await this.countDocuments({ status: 'cancelled' });
    
    // Get total seats booked
    const seatStats = await this.aggregate([
        { $match: { status: 'confirmed' } },
        {
            $group: {
                _id: null,
                totalSeatsBooked: { $sum: '$numberOfSeats' }
            }
        }
    ]);
    
    const totalSeatsBooked = seatStats[0]?.totalSeatsBooked || 0;
    
    return {
        totalBookings,
        cancelledBookings,
        totalSeatsBooked
    };
};

/**
 * Virtual to get booking details
 */
bookingSchema.virtual('bookingDetails').get(function() {
    return {
        bookingId: this._id,
        numberOfSeats: this.numberOfSeats,
        status: this.status,
        bookingDate: this.bookingDate,
        isConfirmed: this.status === 'confirmed',
        isCancelled: this.status === 'cancelled'
    };
});

// Ensure virtuals are included in JSON output
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
