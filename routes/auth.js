const express = require('express')
const router = express.Router()
const passport = require('passport')
const authenticated = require('../middleware/authenticated')
const Config = require('../config')
const AuthController = require('../controllers/auth')

router.post('/auth', passport.authenticate('local'), AuthController.login)
router.get('/auth/google', [
    (req, res, next) => {
        if (req.query.location) {
            req.session.location = req.query.location
        }
        next()
    },
    passport.authenticate('google', {
        scope: ['openid', 'profile', 'email']
    })
])
router.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: Config.front.appUrl + '/?google-auth-failure=1' }),
    AuthController.googleLoginCallback
)
router.get('/auth', authenticated, AuthController.view)
router.delete('/auth', authenticated, AuthController.logout)

module.exports = router