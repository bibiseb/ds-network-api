function authenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.status(401).json({ message: 'You must be authenticated to access this resource' })
}

module.exports = authenticated