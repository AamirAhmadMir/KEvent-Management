const mongoose = require('mongoose');

/**
 * Event Schema
 * Defines the structure for events in the Event Management System
 * 
 * Fields:
 * - title: Event title
 * - description: Event description
 * - date: Event date and time
 * - totalSeats: Total number of seats available
 * - availableSeats: Number of seats currently available
 */
const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
        trim: true,
        minlength: [5, 'Description must be at least 5 characters long'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    date: {
        type: Date,
        required: [true, 'Event date is required'],
        validate: {
            validator: function(value) {
                // Event date must be in the future
                return value > new Date();
            },
            message: 'Event date must be in the future'
        }
    },
    totalSeats: {
        type: Number,
        required: [true, 'Total seats is required'],
        min: [1, 'Total seats must be at least 1'],
        max: [10000, 'Total seats cannot exceed 10,000']
    },
    availableSeats: {
        type: Number,
        required: false, // Will be set by pre-save middleware
        min: [0, 'Available seats cannot be negative'],
        max: [10000, 'Available seats cannot exceed 10,000']
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

/**
 * Note: availableSeats will be set to totalSeats in the controller
 * when creating new events to avoid middleware issues
 */

/**
 * Pre-update middleware to validate availableSeats doesn't exceed totalSeats
 */
eventSchema.pre(['updateOne', 'update'], function(next) {
    const update = this.getUpdate();
    
    // Check if availableSeats is being updated
    if (update.availableSeats !== undefined) {
        // Get the current event to check totalSeats
        this.model.findById(this.getQuery()._id)
            .then(event => {
                if (event && update.availableSeats > event.totalSeats) {
                    return next(new Error('Available seats cannot exceed total seats'));
                }
                next();
            })
            .catch(err => next(err));
    } else {
        next();
    }
});

/**
 * Instance method to check if event is fully booked
 * @returns {boolean} - True if no seats are available
 */
eventSchema.methods.isFullyBooked = function() {
    return this.availableSeats === 0;
};

/**
 * Instance method to check if event is in the past
 * @returns {boolean} - True if event date has passed
 */
eventSchema.methods.isPast = function() {
    return this.date < new Date();
};

/**
 * Instance method to book seats
 * @param {number} seatsToBook - Number of seats to book
 * @returns {boolean} - True if booking was successful
 */
eventSchema.methods.bookSeats = function(seatsToBook) {
    if (seatsToBook <= 0) {
        throw new Error('Number of seats to book must be positive');
    }
    
    if (this.availableSeats < seatsToBook) {
        throw new Error('Not enough seats available');
    }
    
    this.availableSeats -= seatsToBook;
    return true;
};

/**
 * Instance method to cancel booking (return seats)
 * @param {number} seatsToCancel - Number of seats to cancel
 * @returns {boolean} - True if cancellation was successful
 */
eventSchema.methods.cancelBooking = function(seatsToCancel) {
    if (seatsToCancel <= 0) {
        throw new Error('Number of seats to cancel must be positive');
    }
    
    // Ensure we don't exceed total seats
    const newAvailableSeats = this.availableSeats + seatsToCancel;
    if (newAvailableSeats > this.totalSeats) {
        throw new Error('Cannot cancel more seats than total seats');
    }
    
    this.availableSeats = newAvailableSeats;
    return true;
};

/**
 * Static method to find upcoming events
 * @returns {Promise<Array>} - Array of upcoming events
 */
eventSchema.statics.findUpcoming = function() {
    return this.find({ date: { $gt: new Date() } }).sort({ date: 1 });
};

/**
 * Static method to find past events
 * @returns {Promise<Array>} - Array of past events
 */
eventSchema.statics.findPast = function() {
    return this.find({ date: { $lt: new Date() } }).sort({ date: -1 });
};

/**
 * Static method to find available events (not fully booked)
 * @returns {Promise<Array>} - Array of events with available seats
 */
eventSchema.statics.findAvailable = function() {
    return this.find({ availableSeats: { $gt: 0 } }).sort({ date: 1 });
};

/**
 * Virtual to get booking status
 */
eventSchema.virtual('bookingStatus').get(function() {
    if (this.isPast()) {
        return 'Past';
    } else if (this.isFullyBooked()) {
        return 'Fully Booked';
    } else {
        return 'Available';
    }
});

/**
 * Virtual to get percentage of seats booked
 */
eventSchema.virtual('bookingPercentage').get(function() {
    if (this.totalSeats === 0) return 0;
    const bookedSeats = this.totalSeats - this.availableSeats;
    return Math.round((bookedSeats / this.totalSeats) * 100);
});

// Ensure virtuals are included in JSON output
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
