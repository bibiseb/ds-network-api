const Crypto = require('crypto')

module.exports = (length) => {
  return Crypto.randomBytes(length).toString('base64').slice(0, length)
}