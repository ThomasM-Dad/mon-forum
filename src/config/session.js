const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const isProd = process.env.NODE_ENV === 'production';

const store = new MySQLStore({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    createDatabaseTable: false,
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: SEVEN_DAYS,
});

const sessionMiddleware = session({
    name: 'forum.sid',
    secret: process.env.SESSION_SECRET,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: SEVEN_DAYS,
    },
});

module.exports = sessionMiddleware;
module.exports.store = store;