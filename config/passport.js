const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const User = require('../models/users')
const bcrypt = require('bcrypt')
const randomString = require('../utils/random-string')

module.exports = {
  config() {
    passport.serializeUser((user, done) => {
      done(null, user.id)
    })

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await User.findById(id)

        done(null, user)
      } catch (err) {
        done(err)
      }
    })

    passport.use(new LocalStrategy({
        usernameField: 'email'
      },
      async (username, password, done) => {
        const user = await User.findOne({ email: username }).exec()

        if (user === null) {
          return done(null, false, { message: 'Incorrect username' });
        }

        try {
          if (await bcrypt.compare(password, user.password)) {
            return done(null, user)
          } else {
            return done(null, false, { message: 'Incorrect password' })
          }
        } catch (err) {
          return done(err);
        }
      }
    ))

    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CLIENT_CALLBACK_URL
    }, async (accessToken, refreshToken, profile, done) => {
      let emails = [];

      if (Array.isArray(profile.emails)) {
        emails = profile.emails.filter(item => item.verified === true)
      }

      if (emails.length) {
        const email = emails[0].value;
        const user = await User.findOne({ email }).exec()

        if (user === null) {
          let hash;

          try {
            hash = await bcrypt.hash(randomString(16), 10)
          } catch (err) {
            return done(err, null)
          }

          const payload = {
            name: profile.displayName,
            email,
            password: hash,
            role: 'GUEST'
          }

          const user = new User(payload)

          try {
            const newUser = await user.save()

            return done(null, newUser)
          } catch (err) {
            return done(err, null)
          }
        } else {
          return done(null, user)
        }
      }

      return done(new Error('No verified email is present'), null)
    }))
  }
}