const env = process.env.APP_ENV || 'development'

if (env === 'development') {
    require('dotenv').config()
}

module.exports = {
    app: {
        url: process.env.APP_URL || 'http://localhost:3000',
        env
    },
    front: {
        appUrl: process.env.FRONT_APP_URL || 'http://localhost:8080',
    },
    videos: {
        appUrl: process.env.VIDEOS_APP_URL || 'https://localhost:3001'
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:8080'
    },
    database: {
        url: process.env.DATABASE_URL || 'mongodb://localhost:27017/collection'
    },
    cookie: {
        domain: process.env.COOKIE_DOMAIN || 'localhost',
        secret: process.env.COOKIE_SECRET || 'secret'
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        clientCallbackUrl: process.env.GOOGLE_CLIENT_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
    },
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || '',
        cloudFront: {
            keyPairId: process.env.CF_KEY_PAIR_ID || '',
            privateKeyPath: process.env.CF_PRIVATE_KEY_PATH || 'keys/private.pem'
        }
    },
    mail: {
        fromAddress: process.env.MAIL_FROM_ADDRESS || 'hello@domain'
    },
    paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || ''
    }
}