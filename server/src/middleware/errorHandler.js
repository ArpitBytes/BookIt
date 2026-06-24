const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  // Log the error
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn(`${statusCode} - ${err.message}`, {
      path: req.path,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && !err.isOperational
        ? { stack: err.stack }
        : {}),
    },
  });
};

module.exports = errorHandler;
