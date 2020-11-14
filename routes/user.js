const express = require('express')
const router = express.Router()
const UserController = require('../controllers/user')
const authenticated = require('../middleware/authenticated')
const checkRole = require('../middleware/check-role')
const User = require('../models/user')
const getRequestedObject = require('../middleware/get-requested-object')

router.get('/users', [authenticated, checkRole('ADMINISTRATOR')], UserController.get)
router.post('/user', [authenticated, checkRole('ADMINISTRATOR')], UserController.create)
router.get('/user/:id', [authenticated, checkRole('ADMINISTRATOR'), getRequestedObject(User, 'user')], UserController.view)
router.patch('/user/:id', [authenticated, checkRole('ADMINISTRATOR'), getRequestedObject(User, 'user')], UserController.update)
router.delete('/user/:id', [authenticated, checkRole('ADMINISTRATOR'), getRequestedObject(User, 'user')], UserController.remove)

module.exports = router