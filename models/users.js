const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  videos: [{
    _id: {
      type: mongoose.ObjectId,
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  role: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
})

module.exports = mongoose.model('User', schema);