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
    saveUninitialized: false,
    cookie: {
      domain: Config.cookie.domain,
      httpOnly: true,
      secure: (Config.app.env === 'production'),
      sameSite: (Config.app.env === 'production' ? 'none' : 'lax')
    }
  }),
  passport.initialize(),
  passport.session()
)

const todosRouter = require('./routes/todos')
const usersRouter = require('./routes/users')
const authRouter = require('./routes/auth')
const contactRouter = require('./routes/contact')
const videoRouter = require('./routes/videos')
const checkoutRouter = require('./routes/checkout')
const payRouter = require('./routes/pay')

app.use('/todos', todosRouter)
app.use('/users', usersRouter)
app.use('/auth', authRouter)
app.use('/contact', contactRouter)
app.use('/videos', videoRouter)
app.use('/checkout', checkoutRouter)
app.use('/pay', payRouter)

app.get('/', (req, res) => {
  res.json({ message: 'Hello word!' })
})

module.exports = app