const Joi = require('joi')
const Video = require('../models/video')
const Order = require('../models/order')
const mongoose = require('mongoose')

const CheckoutController = {
    async initialize(req, res) {
        const schema = Joi.object({
            items: Joi.array().min(1).items(Joi.object({
                _id: Joi.string().regex(/^[0-9A-F]{24}$/i).required().external(async (value) => {
                    const video = await Video.findById(value).exec()
                    if (video !== null) {
                        return value
                    }
                    throw new Error('Cannot find related video')
                }),
                quantity: Joi.number().integer().min(1).required()
            })).required()
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

        const ids = req.body.items.map(item => mongoose.Types.ObjectId(item._id))

        let videos

        try {
            videos = await Video.find({ _id: { $in: ids } }).exec()
        } catch (err) {
            return res.status(500).json({ message: 'Server error' })
        }

        const payload = {
            sessionId: req.sessionID,
            items: req.body.items.map((item) => {
                const video = videos.find(video => video._id.toString() === item._id)
                return {
                    ...item,
                    name: video.name,
                    price: video.price,
                    total: video.price * item.quantity
                }
            }),
            total: req.body.items.reduce((accumulator, item) => {
                const video = videos.find(video => video._id.toString() === item._id)
                return accumulator + (item.quantity * video.price)
            }, 0),
            status: 'PENDING'
        }

        if (req.user) {
            payload.userId = req.user._id
        }

        const order = new Order(payload)

        try {
            const newOrder = await order.save()

            res.status(201).json(newOrder)
        } catch (err) {
            res.status(500).json({ message: 'Server error' })
        }
    },
    view(req, res) {
        if (req.order.sessionId !== req.sessionID) {
            return res.status(403).send()
        }

        res.json(req.order)
    },
    async updateUser(req, res) {
        if (req.order.sessionId !== req.sessionID) {
            return res.status(403).send()
        }

        req.order.userId = req.user._id

        try {
            const newOrder = await req.order.save()

            res.json(newOrder)
        } catch (err) {
            res.status(500).json({ message: 'Server error' })
        }
    }
}

module.exports = CheckoutController