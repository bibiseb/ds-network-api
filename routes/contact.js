const express = require('express')
const router = express.Router()
const Joi = require('joi')
const aws = require('aws-sdk')

router.post('/', (req, res) => {
	const schema = Joi.object({
		name: Joi.string().min(3).required(),
		email: Joi.string().email().required(),
		message: Joi.string().min(10).required()
	})

	const { error } = schema.validate(req.body)

	if (error) {
		return res.status(422).json({ errors: error.details })
	}

	const options = { region: process.env.AWS_REGION }

	if (process.env.APP_ENV === 'development') {
		options.accessKeyId = process.env.AWS_ACCESS_KEY_ID
		options.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
	}

	const ses = new aws.SES(options)

	const params = {
		Destination: {
			ToAddresses: ['hello@ds-network.be']
		},
		ReplyToAddresses: [req.body.email],
		Message: {
			Body: {
				Text: { Data: req.body.message }
			},
			Subject: { Data: `Message from ${req.body.name}` }
		},
		Source: 'hello@ds-network.be'
	}

	ses.sendEmail(params, (err) => {
		if (err) {
			console.error(err.message);
			res.status(500).send()
		} else {
			res.status(204).send()
		}
	})
})

module.exports = router;