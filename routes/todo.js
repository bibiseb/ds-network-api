const express = require('express')
const router = express.Router()
const TodoController = require('../controllers/todo')
const authenticated = require('../middleware/authenticated')
const checkRole = require('../middleware/check-role')
const Todo = require('../models/todo')
const getRequestedObject = require('../middleware/get-requested-object')

router.get('/todos', TodoController.get)
router.post('/todo', [authenticated, checkRole('ADMINISTRATOR', 'MEMBER')], TodoController.create)
router.get('/todo/:id', getRequestedObject(Todo, 'todo'), TodoController.view)
router.patch('/todo/:id', [authenticated, checkRole('ADMINISTRATOR'), getRequestedObject(Todo, 'todo')], TodoController.update)
router.delete('/todo/:id', [authenticated, checkRole('ADMINISTRATOR'), getRequestedObject(Todo, 'todo')], TodoController.remove)

module.exports = router