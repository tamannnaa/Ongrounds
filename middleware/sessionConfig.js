const session = require('express-session');
const MongoStore = require('connect-mongo');

const configureSession = (app) => {
    app.use(session({
        secret: 'your_secret_key', 
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: 'mongodb://localhost:27017/yourdbname',
            ttl: 14 * 24 * 60 * 60,
            autoRemove: 'native'
        }),
        cookie: {
            maxAge: 14 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        }
    }));
};

module.exports = configureSession;