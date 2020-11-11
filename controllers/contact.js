const Joi = require('joi')
const AWS = require('aws-sdk')
const Config = require('../config')

const ContactController = {
    send(req, res) {
        const schema = Joi.object({
            name: Joi.string().min(3).required(),
            email: Joi.string().email().required(),
            message: Joi.string().min(10).required()
        })

        const { error } = schema.validate(req.body, { abortEarly: false })

        if (error) {
            return res.status(422).json({ errors: error.details })
        }

        const options = {}

        if (Config.app.env === 'development') {
            options.region = Config.aws.region
            options.accessKeyId = Config.aws.accessKeyId
            options.secretAccessKey = Config.aws.secretAccessKey
        }

        const ses = new AWS.SES(options)

        const params = {
            Destination: {
                ToAddresses: [Config.mail.fromAddress]
            },
            ReplyToAddresses: [req.body.email],
            Message: {
                Body: {
                    Text: { Data: req.body.message }
                },
                Subject: { Data: `Message from ${req.body.name}` }
            },
            Source: Config.mail.fromAddress
        }

        ses.sendEmail(params, (err) => {
            if (err) {
                res.status(500).json({ message: 'Server error'} )
            } else {
                res.status(204).send()
            }
        })
    }
}

module.exports = ContactController