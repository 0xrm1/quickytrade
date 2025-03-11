const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels: logLevels,
  format: logFormat,
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
    // File transport for production
    ...(process.env.NODE_ENV === 'production'
      ? [
          // Error log
          new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
          }),
          // Combined log
          new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
          }),
        ]
      : []),
  ],
});

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger; 