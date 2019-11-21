const mongoose = require('mongoose'),
    schema = mongoose.Schema

const bookingSchema = new schema({
    event: {
        type: schema.Types.ObjectId,
        ref: 'Event'
    },
    user: {
        type: schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true })

module.exports = mongoose.model('Booking', bookingSchema)