'use strict';

const multer = require('multer');

/**
 * 404 handler for unknown routes.
 */
function notFound(req, res, next) {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Centralised error handler — maps thrown errors to the error schema (§6 README).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred.';

  if (err instanceof multer.MulterError) {
    status = 400;
    code = err.code; // e.g. LIMIT_FILE_SIZE
    if (err.code === 'LIMIT_FILE_SIZE') message = 'Uploaded file exceeds the size limit.';
  }

  if (status >= 500) {
    // Surface server-side faults in logs but never leak internals to the client.
    console.error(`[gateway:error] ${code}:`, err.stack || err.message);
  }

  res.status(status).json({ status: 'error', code, message });
}

module.exports = { notFound, errorHandler };
