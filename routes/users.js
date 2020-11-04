const express = require('express')
const router = express.Router()
const User = require('../models/users')
const bcrypt = require('bcrypt')
const authenticated = require('../middleware/authenticated')
const checkRole = require('../middleware/check-role')
const Joi = require('joi')
const roles = require('../models/roles')

router.get('/', [authenticated, checkRole('ADMINISTRATOR')], async (req, res) => {
	try {
		const users = await User.find()

		res.json(users.map((user) => {
			return {
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				date: user.date
			}
		}))
	} catch (err) {
		res.status(500).json({ message: err.message })
	}
})

router.post('/', [authenticated, checkRole('ADMINISTRATOR')], async (req, res) => {
	const schema = Joi.object({
		name: Joi.string().min(3).required(),
		email: Joi.string().email().required(),
		password: Joi.string().min(8).required(),
		role: Joi.string().valid(...roles).required()
	})

	const { error } = schema.validate(req.body, { abortEarly: false })

	if (error) {
		return res.status(422).json({ errors: error.details })
	}

	let hash;

	try {
		hash = await bcrypt.hash(req.body.password, 10)
	} catch (err) {
		return res.status(500).json({ message: err.message })
	}

	const payload = {
		name: req.body.name,
		email: req.body.email,
		password: hash,
		role: req.body.role,
	}

	const user = new User(payload)

	try {
		const newUser = await user.save()

		res.status(201).json({
			_id: newUser._id,
			name: newUser.name,
			email: newUser.email,
			role: newUser.role,
			date: newUser.date
		})
	} catch (err) {
		res.status(400).json({ message: err.message })
	}
})

router.get('/:id', [authenticated, checkRole('ADMINISTRATOR'), getUser], (req, res) => {
	res.json({
		_id: res.user._id,
		name: res.user.name,
		email: res.user.email,
		role: res.user.role,
		date: res.user.date
	})
})

router.patch('/:id', [authenticated, checkRole('ADMINISTRATOR'), getUser], async (req, res) => {
	const schema = Joi.object({
		name: Joi.string().min(3),
		email: Joi.string().email(),
		password: Joi.string().min(8),
		role: Joi.string().valid(...roles).optional()
	})

	const { error } = schema.validate(req.body, { abortEarly: false })

	if (error) {
		return res.status(422).json({ errors: error.details })
	}

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

	if (req.body.role !== undefined) {
		res.user.role = req.body.role
	}

	try {
		const updatedUser = await res.user.save()

		res.json({
			_id: updatedUser._id,
			name: updatedUser.name,
			email: updatedUser.email,
			role: updatedUser.role,
			date: updatedUser.date
		})
	} catch (err) {
		res.status(400).json({ message: err.message })
	}
})

router.delete('/:id', [authenticated, checkRole('ADMINISTRATOR'), getUser], async (req, res) => {
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