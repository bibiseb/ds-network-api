const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    providerId: {
        type: String,
        default: ''
    },
    states: {
        type: Array,
        default: []
    },
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