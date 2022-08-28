require('dotenv').config();

module.exports = {
    database: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },
    google: {
        password: process.env.CUENTA_PASS
    }
}