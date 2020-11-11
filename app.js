const express = require('express')
const app = express()
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const cors = require('cors')
const db = require('./config/mongoose')
const passport = require('passport')
require('./config/passport').config()
const cookieParser = require('cookie-parser')
const Config = require('./config')

if (Config.app.env === 'production') {
  app.set('trust proxy', true)
}

app.use(cors({
  origin: Config.cors.origin,
  credentials: true
}))

app.use(
  cookieParser(Config.cookie.secret),
  express.json(),
  session({
    name: 'dsnetwork_session',
    secret: Config.cookie.secret,
    store: new MongoStore({
      mongooseConnection: db
    }),
    resave: false,
    saveUninitialized: true,
    cookie: {
      domain: Config.cookie.domain,
      httpOnly: true,
      secure: (Config.app.env === 'production'),
      sameSite: 'lax'
    }
  }),
  passport.initialize(),
  passport.session()
)

app.use(require('./routes'))

module.exports = app