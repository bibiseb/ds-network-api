const express = require('express')
const router = express.Router()
const Joi = require('joi')
const Config = require('../config')
const Order = require('../models/order')
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
        return res.status(422).send({ message: 'Bad request' })
    }

    let transaction;

    try {
        transaction = await Transaction.findById(req.params.id).exec()
    } catch (err) {
        return res.status(500).json({ message: 'Server error'} )
    }

    if (transaction === null) {
        return res.status(404).json({ message: 'Cannot find transaction' })
    }

    const completedState = transaction.states.find((state) => state.state === 'COMPLETED')

    if (completedState) {
        return res.status(422).json({ message: 'Payment already processed' })
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

        const newTransation = await transaction.save()

        const order = await Order.findById(newTransation.orderId).exec()

        order.status = 'PAID'
        order.transactionId = newTransation._id

        await order.save()

        let redirect = Config.front.appUrl

        if (req.session.location) {
            redirect += req.session.location

            delete req.session.location
        }

        res.redirect(redirect)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

router.get('/cancel/:id', async (req, res) => {
    let transaction;

    try {
        transaction = await Transaction.findById(req.params.id).exec()
    } catch (err) {
        return res.status(500).json({ message: 'Server error'} )
    }

    if (transaction === null) {
        return res.status(404).json({ message: 'Cannot find transaction' })
    }

    const processedState = transaction.states.find((state) => state.state === 'COMPLETED' || state.state === 'CANCELLED')

    if (processedState) {
        return res.status(422).json({ message: 'Transaction processed' })
    }

    transaction.states.push({
        state: 'CANCELLED',
        date: Date.now()
    })

    try {
        await transaction.save()
    } catch (err) {
        return res.status(500).json({ message: 'Server error' })
    }

    let redirect = Config.front.appUrl

    if (req.session.location) {
        redirect += req.session.location

        delete req.session.location
    }

    res.redirect(redirect)
})

router.post('/:orderId', async (req, res) => {
    let order

    try {
        order = await Order.findById(req.params.orderId).exec()
    } catch (err) {
        return res.status(500).json({ message: 'Server error' })
    }

    if (order === null) {
        return res.status(404).json({ message: 'Cannot find order' })
    }

    if (order.sessionId !== req.sessionID) {
        return res.status(403).send()
    }

    if (order.status === 'PAID') {
        return res.status(423).json({ message: 'Order is already paid'})
    }

    const transaction = new Transaction({
        orderId: order._id
    })

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
            return_url: Config.app.url + '/pay/return/' + newTransaction._id,
            cancel_url: Config.app.url + '/pay/cancel/' + newTransaction._id
        },
        purchase_units: [
            {
                amount: {
                    currency_code: 'EUR',
                    value: order.total.toFixed(2)
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

        if (req.body.location) {
            req.session.location = req.body.location
        }

        res.json({ redirect: approveLink.href })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router;