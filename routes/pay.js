const express = require('express')
const router = express.Router()
const Joi = require('joi')
const Config = require('../config')
const Transaction = require('../models/transaction')
const Paypal = require('@paypal/checkout-server-sdk');

const environment = new Paypal.core.SandboxEnvironment(
    Config.paypal.clientId,
    Config.paypal.clientSecret
)

const client = new Paypal.core.PayPalHttpClient(environment)

router.get('/return/:id', async (req, res) => {
    const schema = Joi.object({
        token: Joi.string().required(),
        PayerID: Joi.string().required()
    })

    const { error } = schema.validate(req.query)

    if (error) {
        return res.status(400).send({ message: 'Bad request' })
    }

    let transaction;

    try {
        transaction = await Transaction.findById(req.params.id).exec()
    } catch (err) {
        return res.status(400).json({ message: 'Invalid request'} )
    }

    const completedState = transaction.states.find((state) => state.state === 'COMPLETED')

    if (completedState) {
        return res.status(400).json({ message: 'Payment already processed' })
    }

    const data = { token: req.query.token, PayerID: req.query.PayerID, ...transaction.data }
    const request = new Paypal.orders.OrdersCaptureRequest(transaction.providerId)

    request.requestBody({})

    try {
        const response = await client.execute(request)

        transaction.states.push({
            state: response.result.status,
            date: Date.now()
        })
        transaction.data = data

        transaction = await transaction.save()

        res.json(transaction)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

router.get('/', async (req, res) => {
    const transaction = new Transaction({})

    let newTransaction;

    try {
        newTransaction = await transaction.save()
    } catch (err) {
        return res.status(500).json({ message: 'Server error' })
    }

    const request = new Paypal.orders.OrdersCreateRequest()

    request.requestBody({
        intent: 'CAPTURE',
        application_context: {
            return_url: 'http://localhost:3000/pay/return/' + newTransaction._id,
            cancel_url: 'http://localhost:3000/pay/cancel/' + newTransaction._id
        },
        purchase_units: [
            {
                amount: {
                    currency_code: 'EUR',
                    value: '1.00'
                }
            }
        ]
    })

    let response

    try {
        response = await client.execute(request)
    } catch (err) {
        res.status(500).json({ message: 'Server error '})
    }

    newTransaction.providerId = response.result.id
    newTransaction.states.push({
        state: response.result.status,
        date: Date.now()
    })
    newTransaction.data = {
        links: response.result.links
    }

    try {
        newTransaction = await newTransaction.save()
        const approveLink = newTransaction.data.links.find((link) => link.rel === 'approve')

        res.redirect(approveLink.href)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router;