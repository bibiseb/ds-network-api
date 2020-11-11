const express = require('express')
const router = express.Router()
const ContactController = require('../controllers/contact')

router.post('/contact', ContactController.send)

module.exports = router;