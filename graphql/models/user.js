const mongoose = require('mongoose'),
    schema = mongoose.Schema

const userSchema = new schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdEvents: [{
        type: schema.Types.ObjectId,
        ref: 'Event'
    }]
}, { timestamps: true })

module.exports = mongoose.model('User',userSchema)