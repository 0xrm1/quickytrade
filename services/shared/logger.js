/**
 * Logger Modülü
 * 
 * Bu modül, uygulama genelinde tutarlı günlük kaydı sağlar.
 * Winston kütüphanesini kullanarak farklı seviyelerde günlük kaydı tutar
 * ve yapılandırılabilir çıktı formatları sunar.
 */

const winston = require('winston');
const { format, transports } = winston;

// Ortam değişkenlerini al
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const SERVICE_NAME = process.env.SERVICE_NAME || 'quickytrade';

// Günlük formatını oluştur
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
  format.printf(({ level, message, timestamp, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${service}] ${level.toUpperCase()}: ${message} ${metaStr}`;
  })
);

// Winston logger'ı oluştur
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: SERVICE_NAME },
  transports: [
    // Konsola günlük kaydı
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
  exitOnError: false,
});

// Üretim ortamında dosyaya günlük kaydı ekle
if (NODE_ENV === 'production') {
  logger.add(
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
  
  logger.add(
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Servis adını ayarla
logger.setService = (serviceName) => {
  logger.defaultMeta.service = serviceName;
  return logger;
};

// HTTP istekleri için günlük kaydı
logger.logHttpRequest = (req, res, responseTime) => {
  const { method, url, ip, headers } = req;
  const userAgent = headers['user-agent'];
  const statusCode = res.statusCode;
  
  const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  logger[logLevel](`HTTP ${method} ${url} ${statusCode} ${responseTime}ms`, {
    method,
    url,
    statusCode,
    responseTime,
    ip,
    userAgent,
  });
};

// WebSocket mesajları için günlük kaydı
logger.logWebSocketMessage = (type, data, source) => {
  logger.debug(`WebSocket ${type}`, {
    type,
    source,
    data: typeof data === 'object' ? JSON.stringify(data) : data,
  });
};

// Hata günlüğü
logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    ...context,
    stack: error.stack,
    name: error.name,
    code: error.code,
  });
};

// Performans günlüğü
logger.logPerformance = (operation, duration, metadata = {}) => {
  logger.info(`Performance: ${operation} took ${duration}ms`, {
    operation,
    duration,
    ...metadata,
  });
};

module.exports = logger; 