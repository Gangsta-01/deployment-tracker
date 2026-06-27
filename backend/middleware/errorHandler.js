const { validationResult } = require('express-validator');

/**
 * Run express-validator checks and return 422 if any fail.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * Global error handler — mount last in server.js
 */
function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'A record with that value already exists.' });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { validate, errorHandler };
