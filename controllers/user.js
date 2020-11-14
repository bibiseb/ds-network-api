const User = require('../models/user')
const Video = require('../models/video')
const Joi = require('joi')
const roles = require('../models/roles')
const bcrypt = require('bcrypt')

const UserController = {
    async get(req, res) {
        try {
            const users = await User.find()

            res.json(users.map((user) => {
                return {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    videos: user.videos,
                    role: user.role,
                    date: user.date
                }
            }))
        } catch (err) {
            res.status(500).json({ message: 'Server error' })
        }
    },
    async create(req, res) {
        const schema = Joi.object({
            name: Joi.string().min(3).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
            videos: Joi.array().items(Joi.object({
                _id: Joi.string().regex(/^[0-9A-F]{24}$/i).required().external(async (value) => {
                    const video = await Video.findById(value).exec()
                    if (video !== null) {
                        return value
                    }
                    throw new Error('Cannot find related video')
                })
            })),
            role: Joi.string().valid(...roles).required()
        })

        try {
            await schema.validateAsync(req.body, {abortEarly: false})
        } catch (err) {
            if (err instanceof Joi.ValidationError) {
                return res.status(422).json({ errors: err.details })
            } else {
                return res.status(422).json({ message: err.message })
            }
        }

        let hash;

        try {
            hash = await bcrypt.hash(req.body.password, 10)
        } catch (err) {
            return res.status(500).json({ message: 'Server error' })
        }

        const payload = {
            name: req.body.name,
            email: req.body.email,
            password: hash,
            videos: req.body.videos !== undefined ? req.body.videos : [],
            role: req.body.role,
        }

        const user = new User(payload)

        try {
            const newUser = await user.save()

            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                videos: newUser.videos,
                role: newUser.role,
                date: newUser.date
            })
        } catch (err) {
            res.status(500).json({ message: 'Server error' })
        }
    },
    view(req, res) {
        res.json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            videos: req.user.videos,
            role: req.user.role,
            date: req.user.date
        })
    },
    async update(req, res) {
        const schema = Joi.object({
            name: Joi.string().min(3),
            email: Joi.string().email(),
            password: Joi.string().min(8),
            videos: Joi.array().items(Joi.object({
                _id: Joi.string().regex(/^[0-9A-F]{24}$/i).required().external(async (value) => {
                    const video = await Video.findById(value).exec()
                    if (video !== null) {
                        return value
                    }
                    throw new Error('Cannot find related video')
                })
            })),
            role: Joi.string().valid(...roles).optional()
        })

        try {
            await schema.validateAsync(req.body, { abortEarly: false })
        } catch (err) {
            if (err instanceof Joi.ValidationError) {
                return res.status(422).json({ errors: err.details })
            } else {
                return res.status(422).json({ message: err.message })
            }
        }

        if (req.body.name !== undefined) {
            req.user.name = req.body.name
        }

        if (req.body.email !== undefined) {
            req.user.email = req.body.email
        }

        if (req.body.password !== undefined) {
            let hash;

            try {
                hash = await bcrypt.hash(req.body.password, 10);
            } catch (err) {
                return res.status(500).json({ message: 'Server error' })
            }

            req.user.password = hash
        }

        if (req.body.videos !== undefined) {
            req.user.videos = req.body.videos
        }

        if (req.body.role !== undefined) {
            req.user.role = req.body.role
        }

        try {
            const updatedUser = await req.user.save()

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                videos: updatedUser.videos,
                role: updatedUser.role,
                date: updatedUser.date
            })
        } catch (err) {
            res.status(500).json({ message: 'Server error' })
        }
    },
    async remove(req, res) {
        try {
            await req.user.remove()

            res.json({ message: 'User deleted' })
        } catch (err) {
            res.status(500).json({ message: 'Server error' })
        }
    }
}

module.exports = UserController