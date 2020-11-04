const express = require('express')
const app = express()
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const cors = require('cors')
const db = require('./config/mongoose')
const passport = require('passport')
require('./config/passport').config()

if (process.env.APP_ENV === 'production') {
  app.set('trust proxy', true)
}

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(
  express.json(),
  session({
    name: 'dsnetwork_session',
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      mongooseConnection: db
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      domain: process.env.COOKIE_DOMAIN,
      httpOnly: true,
      secure: (process.env.APP_ENV === 'production' ? true : false),
      sameSite: (process.env.APP_ENV === 'production' ? 'none' : 'lax')
    }
  }),
  passport.initialize(),
  passport.session()
)

const todosRouter = require('./routes/todos')
const usersRouter = require('./routes/users')
const authRouter = require('./routes/auth')
const contactRouter = require('./routes/contact')

app.use('/todos', todosRouter)
app.use('/users', usersRouter)
app.use('/auth', authRouter)
app.use('/contact', contactRouter)

app.get('/', (req, res) => {
  res.json({ message: 'Hello word!' })
})

module.exports = app