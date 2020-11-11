const express = require('express')
const router = express.Router()
const VideoController = require('../controllers/video')
const authenticated = require('../middleware/authenticated')
const checkRole = require('../middleware/check-role')
const Video = require('../models/video')
const getRequestedObject = require('../middleware/get-requested-object')

router.get('/videos', VideoController.get)
router.post('/video', [authenticated, checkRole('ADMINISTRATOR')], VideoController.create)
router.get('/video/:id', getRequestedObject(Video, 'video'), VideoController.view)
router.patch('/video/:id', [authenticated, checkRole('ADMINISTRATOR'), getRequestedObject(Video, 'video')], VideoController.update)
router.delete('/video/:id', [authenticated, checkRole('ADMINISTRATOR'), getRequestedObject(Video, 'video')], VideoController.remove)
router.post('/video/:id/authorize', getRequestedObject(Video, 'video'), VideoController.authorize)

module.exports = router