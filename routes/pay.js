const express = require('express')
const router = express.Router()
const PayController = require('../controllers/pay')

router.post('/pay/:orderId', PayController.initialize)
router.get('/pay/return/:transactionId', PayController.return)
router.get('/pay/cancel/:transactionId', PayController.cancel)

module.exports = router;