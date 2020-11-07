const express = require('express')
const router = express.Router()
const Video = require('../models/video')
const authenticated = require('../middleware/authenticated')
const checkRole = require('../middleware/check-role')
const Joi = require('joi')
const path = require('path')
const fs = require('fs')
const AWS = require('aws-sdk')
const Config = require('../config')

router.get('/', async (req, res) => {
  try {
    const videos = await Video.find()

    res.json(videos)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', [authenticated, checkRole('ADMINISTRATOR')], async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    description: Joi.string().allow(''),
    poster: Joi.string().allow(''),
    key: Joi.string().min(3).required()
  })

  const { error } = schema.validate(req.body, { abortEarly: false })

  if (error) {
    return res.status(422).json({ errors: error.details })
  }

  const video = new Video({
    name: req.body.name,
    description: req.body.description,
    poster: req.body.poster,
    key: req.body.key
  })

  try {
    const newVideo = await video.save()

    res.status(201).json(newVideo)
  } catch (err) {
    res.status(500).json({ message: 'Server error'})
  }
})

router.get('/:id', getVideo, (req, res) => {
  res.json(res.video)
})

router.patch('/:id', [authenticated, checkRole('ADMINISTRATOR'), getVideo], async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(3),
    description: Joi.string().allow(''),
    poster: Joi.string().allow(''),
    key: Joi.string().min(3)
  })

  const { error } = schema.validate(req.body, { abortEarly: false })

  if (error) {
    return res.status(422).json({ errors: error.details })
  }

  if (req.body.name !== undefined) {
    res.video.name = req.body.name
  }

  if (req.body.description !== undefined) {
    res.video.description = req.body.description
  }

  if (req.body.poster !== undefined) {
    res.video.poster = req.body.poster
  }

  if (req.body.key !== undefined) {
    res.video.key = req.body.key
  }

  try {
    const updatedVideo = await res.video.save()

    res.json(updatedVideo)
  } catch (err) {
    res.status(500).json({ message: 'Server error'})
  }
})

router.delete('/:id', [authenticated, checkRole('ADMINISTRATOR'), getVideo], async (req, res) => {
  try {
    await res.video.remove()

    res.json({ message: 'Video deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error'})
  }
})

router.post('/:id/watch', async (req, res) => {
    let video

    try {
        video = await Video.findById(req.params.id).exec()
    } catch (err) {
        return res.status(500).json({ message: 'Server error' })
    }

    const signer = new AWS.CloudFront.Signer(
        Config.aws.cloudFront.keyPairId,
        fs.readFileSync(
            path.resolve(Config.aws.cloudFront.privateKeyPath)
        )
    )

    const cookies = signer.getSignedCookie({
        policy: JSON.stringify({
            Statement: [
                {
                    Resource: Config.videos.appUrl + '/' + video.key + '/*',
                    Condition: {
                        DateLessThan: {
                            'AWS:EpochTime': Math.floor(Date.now() / 1000) + 3600
                        }
                    }
                }
            ]
        })
    })

    Object.keys(cookies).forEach((cookie) => {
        res.cookie(cookie, cookies[cookie], {
            domain: Config.cookie.domain,
            secure: Config.app.env === 'production'
        })
    })

    res.status(204).send()
})

async function getVideo(req, res, next) {
  let video

  try {
    video = await Video.findById(req.params.id)

    if (video === null) {
      return res.status(404).json({ message: 'Cannot find video' })
    }
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }

  res.video = video

  next()
}

module.exports = router