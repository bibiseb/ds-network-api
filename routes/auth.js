const express = require('express')
const router = express.Router()
const passport = require('passport')
const authenticated = require('../middleware/authenticated')
const Config = require('../config')

router.post('/', passport.authenticate('local'), (req, res) => {
  const data = {
    _id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    date: req.user.date
  }

  res.json(data)
})

router.get('/', authenticated, (req, res) => {
  const data = {
    _id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    date: req.user.date
  }
  
  res.json(data)
})

router.delete('/', authenticated, (req, res) => {
  req.logOut()
  res.status(204).send()
})

router.get('/google', passport.authenticate('google', {
  scope: ['openid', 'profile', 'email']
}))

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: Config.front.appUrl + '/?google-auth-failure=1' }),
  (req, res) => {
    res.redirect(Config.front.appUrl)
  }
)

module.exports = router;