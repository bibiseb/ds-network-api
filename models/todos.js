const mongoose = require('mongoose')

const schema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	description: {
		type: String,
		default: ''
	},
	date: {
		type: Date,
		required: true,
		default: Date.now
	}
})

module.exports = mongoose.model('Todo', schema);