const express = require('express')
const router = express.Router()
const User = require('../models/users')
const Video = require('../models/video')
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
        videos: user.videos,
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
    return res.status(500).json({ message: err.message })
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
    res.status(400).json({ message: err.message })
  }
})

router.get('/:id', [authenticated, checkRole('ADMINISTRATOR'), getUser], (req, res) => {
  res.json({
    _id: res.user._id,
    name: res.user.name,
    email: res.user.email,
    videos: res.user.videos,
    role: res.user.role,
    date: res.user.date
  })
})

router.patch('/:id', [authenticated, checkRole('ADMINISTRATOR'), getUser], async (req, res) => {
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

  if (req.body.videos !== undefined) {
    res.user.videos = req.body.videos
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
      videos: updatedUser.videos,
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