const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    orderId: {
        type: mongoose.ObjectId,
        required: true
    },
    providerId: {
        type: String,
        default: ''
    },
    states: [
        {
            _id: false,
            state: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                required: true
            }
        }
    ],
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    data: {
        type: Object,
        default: {}
    }
})

module.exports = mongoose.model('Transaction', schema);