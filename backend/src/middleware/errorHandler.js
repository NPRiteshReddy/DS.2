const { validationResult } = require('express-validator');

/**
 * Validation middleware - checks for validation errors
 * Usage: Add after express-validator checks in route
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Global error handler middleware
 * Catches all errors and returns a consistent JSON response
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Default error status and message
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  // Handle specific error types
  let errorResponse = {
    success: false,
    error: message
  };

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || undefined;
  }

  // Handle validation errors from express-validator
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.error = 'Validation failed';
    errorResponse.validationErrors = err.errors;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse.error = 'Invalid token';
    return res.status(401).json(errorResponse);
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse.error = 'Token expired';
    return res.status(401).json(errorResponse);
  }

  // Handle Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    errorResponse.error = 'Database error';
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = err.message;
    }
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: asyncHandler(async (req, res) => { ... })
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class for creating errors with status codes
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, asyncHandler, AppError, validate };
