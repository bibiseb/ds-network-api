const mongoose = require('mongoose')
const Config = require('../config')

mongoose.connect(Config.database.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

let db = mongoose.connection

db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Database connected'))

module.exports = db