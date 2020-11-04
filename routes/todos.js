const express = require('express')
const router = express.Router()
const Todo = require('../models/todos')
const authenticated = require('../middleware/authenticated')
const checkRole = require('../middleware/check-role')
const Joi = require('joi')

router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find()

    res.json(todos)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', [authenticated, checkRole('MEMBER', 'ADMINISTRATOR')], async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    description: Joi.string().allow('')
  })

  const { error } = schema.validate(req.body, { abortEarly: false })

  if (error) {
    return res.status(422).json({ errors: error.details })
  }

  const todo = new Todo({
    name: req.body.name,
    description: req.body.description
  })

  try {
    const newTodo = await todo.save()

    res.status(201).json(newTodo)
  } catch (err) {
    res.status(500).json({ message: 'Server error'})
  }
})

router.get('/:id', getTodo, (req, res) => {
  res.json(res.todo)
})

router.patch('/:id', [authenticated, checkRole('ADMINISTRATOR'), getTodo], async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(3),
    description: Joi.string().allow('')
  })

  const { error } = schema.validate(req.body, { abortEarly: false })

  if (error) {
    return res.status(422).json({ errors: error.details })
  }

  if (req.body.name !== undefined) {
    res.todo.name = req.body.name
  }

  if (req.body.description !== undefined) {
    res.todo.description = req.body.description
  }

  try {
    const updatedTodo = await res.todo.save()

    res.json(updatedTodo)
  } catch (err) {
    res.status(500).json({ message: 'Server error'})
  }
})

router.delete('/:id', [authenticated, checkRole('ADMINISTRATOR'), getTodo], async (req, res) => {
  try {
    await res.todo.remove()

    res.json({ message: 'Todo deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error'})
  }
})

async function getTodo(req, res, next) {
  let todo

  try {
    todo = await Todo.findById(req.params.id)

    if (todo === null) {
      return res.status(404).json({ message: 'Cannot find todo' })
    }
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }

  res.todo = todo

  next()
}

module.exports = router