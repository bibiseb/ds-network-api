const express = require('express')
const router = express.Router()
const User = require('../models/users')
const bcrypt = require('bcrypt')
const authenticated = require('../middleware/authenticated')

router.get('/', authenticated, async (req, res) => {
	try {
		const users = await User.find()

		res.json(users.map((user) => {
			return {
				_id: user._id,
				name: user.name,
				email: user.email,
				date: user.date
			}
		}))
	} catch (err) {
		res.status(500).json({ message: err.message })
	}
})

router.post('/', authenticated, async (req, res) => {
	let hash;

	try {
		hash = await bcrypt.hash(req.body.password, 10)
	} catch (err) {
		return res.status(500).json({ message: err.message })
	}

	const payload = {
		name: req.body.name,
		email: req.body.email,
		password: hash
	}

	const user = new User(payload)

	try {
		const newUser = await user.save()

		res.status(201).json({
			_id: newUser._id,
			name: newUser.name,
			email: newUser.email,
			date: newUser.date
		})
	} catch (err) {
		res.status(400).json({ message: err.message })
	}
})

router.get('/:id', [authenticated, getUser], (req, res) => {
	res.json({
		_id: res.user._id,
		name: res.user.name,
		email: res.user.email,
		date: res.user.date
	})
})

router.patch('/:id', [authenticated, getUser], async (req, res) => {
	if (req.body.name !== undefined) {
		res.user.name = req.body.name
	}

	if (req.body.email !== undefined) {
		res.user.email = req.body.email
	}

	if (req.body.password !== undefined) {
		let hash;

		try {
			hash = await bcrypt.hash(req.body.password, 10);
		} catch (err) {
			return res.status(500).json({ message: err.message })
		}

		res.user.password = hash
	}

	try {
		const updatedUser = await res.user.save()

		res.json({
			_id: updatedUser._id,
			name: updatedUser.name,
			email: updatedUser.email,
			date: updatedUser.date
		})
	} catch (err) {
		res.status(400).json({ message: err.message })
	}
})

router.delete('/:id', [authenticated, getUser], async (req, res) => {
	try {
		await res.user.remove()

		res.json({ message: 'User deleted' })
	} catch (err) {
		res.status(500).json({ message: err.message })
	}
})

async function getUser(req, res, next) {
	let user

	try {
		user = await User.findById(req.params.id)

		if (user === null) {
			return res.status(404).json({ message: 'Cannot find user' })
		}
	} catch (err) {
		return res.status(500).json({ message: err.message })
	}

	res.user = user

	next()
}

module.exports = router