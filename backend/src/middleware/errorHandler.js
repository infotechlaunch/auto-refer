/**
 * Central error handler middleware.
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Validation errors
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      error: err.message,
      details: err.details || undefined,
    });
  }

  // Not found
  if (err.type === 'not_found') {
    return res.status(404).json({
      success: false,
      error: err.message,
    });
  }

  // Conflict (duplicate)
  if (err.type === 'conflict') {
    return res.status(409).json({
      success: false,
      error: err.message,
    });
  }

  // PostgreSQL unique constraint violation (code 23505)
  if (err.code === '23505' || (err.message && err.message.includes('duplicate key value'))) {
    return res.status(409).json({
      success: false,
      error: 'A record with this value already exists.',
    });
  }

  // PostgreSQL foreign key violation (code 23503)
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced record does not exist.',
    });
  }

  // PostgreSQL check constraint violation (code 23514)
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Invalid value provided.',
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
}

/**
 * 404 handler for unmatched routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}

module.exports = { errorHandler, notFoundHandler };
