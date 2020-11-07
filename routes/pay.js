const express = require('express')
const router = express.Router()
const Joi = require('joi')
const path = require('path')
const fs = require('fs')
const AWS = require('aws-sdk')
const Config = require('../config')

router.post('/', (req, res) => {
    const keys = ['sample1', 'sample2']

    const schema = Joi.object({
        key: Joi.string().valid(...keys).required()
    })

    const { error } = schema.validate(req.body, { abortEarly: false })

    if (error) {
        return res.status(422).json({ errors: error.details })
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
                    Resource: Config.videos.appUrl + '/' + req.body.key + '/*',
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

module.exports = router;