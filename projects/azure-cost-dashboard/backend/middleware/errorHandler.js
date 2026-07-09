// Central Express error handler. Route handlers forward errors here via
// next(err); this shapes a consistent JSON response and logs stack traces
// only outside production.

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  // Log the stack trace in development only (NODE_ENV !== 'production').
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err.stack || err);
  }

  res.status(status).json({
    error: true,
    message: err.message || 'Internal Server Error',
    code: err.code || status,
    timestamp: new Date().toISOString(),
  });
}

module.exports = errorHandler;
