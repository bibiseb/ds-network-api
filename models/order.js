const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    userId: {
        type: mongoose.ObjectId
    },
    items: [{
        _id: mongoose.ObjectId,
        name: String,
        quantity: Number,
        price: Number,
        total: Number
    }],
    total: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    }
})

module.exports = mongoose.model('Order', schema);