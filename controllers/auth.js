const Config = require('../config')

const AuthController = {
  login(req, res) {
    const data = {
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      videos: req.user.videos,
      role: req.user.role,
      date: req.user.date
    }

    res.json(data)
  },
  view(req, res) {
    const data = {
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      videos: req.user.videos,
      role: req.user.role,
      date: req.user.date
    }

    res.json(data)
  },
  googleLoginCallback(req, res) {
    let redirect = Config.front.appUrl
    if (req.session.location) {
      redirect += req.session.location
      delete req.session.location
    }
    res.redirect(redirect)
  },
  logout(req, res) {
    req.logOut()
    res.status(204).send()
  }
}

module.exports = AuthController