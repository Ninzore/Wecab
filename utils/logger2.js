const winston = require('winston');

const logger2 = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.splat(),
        winston.format.simple(),
    ),
    transports: [
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize:10485760
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize:10485760
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.simple(),
            ),
            silent: process.env.NODE_ENV === 'test'
        })
    ]
});

module.exports = logger2;