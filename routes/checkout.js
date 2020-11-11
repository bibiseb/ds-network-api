const express = require('express')
const router = express.Router()
const Order = require('../models/order')
const CheckoutController = require('../controllers/checkout')
const getRequestedObject = require('../middleware/get-requested-object')

router.post('/checkout', CheckoutController.initialize)
router.get('/checkout/:id', getRequestedObject(Order, 'order'), CheckoutController.view)
router.patch('/checkout/:id', getRequestedObject(Order, 'order'), CheckoutController.updateUser)

module.exports = router