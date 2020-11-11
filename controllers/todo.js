const Todo = require('../models/todos')
const Joi = require('joi')

const TodoController = {
    async get(req, res) {
        try {
            const todos = await Todo.find()

            res.json(todos)
        } catch (err) {
            res.status(500).json({ message: 'Server error' })
        }
    },
    async create(req, res) {
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
            description: req.body.description,
            complete: false
        })

        try {
            const newTodo = await todo.save()

            res.status(201).json(newTodo)
        } catch (err) {
            res.status(500).json({ message: 'Server error'})
        }
    },
    view(req, res) {
        res.json(req.todo)
    },
    async update(req, res) {
        const schema = Joi.object({
            name: Joi.string().min(3),
            description: Joi.string().allow(''),
            complete: Joi.boolean()
        })

        const { error } = schema.validate(req.body, { abortEarly: false })

        if (error) {
            return res.status(422).json({ errors: error.details })
        }

        if (req.body.name !== undefined) {
            req.todo.name = req.body.name
        }

        if (req.body.description !== undefined) {
            req.todo.description = req.body.description
        }

        if (req.body.complete !== undefined) {
            req.todo.complete = req.body.complete
        }

        try {
            const updatedTodo = await req.todo.save()

            res.json(updatedTodo)
        } catch (err) {
            res.status(500).json({ message: 'Server error'})
        }
    },
    async remove(req, res) {
        try {
            await req.todo.remove()

            res.json({ message: 'Todo deleted' })
        } catch (err) {
            res.status(500).json({ message: 'Server error'})
        }
    }
}

module.exports = TodoController