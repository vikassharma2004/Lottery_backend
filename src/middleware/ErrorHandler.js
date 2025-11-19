// utils/error-utils.js (ES Module)

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // Distinguish operational errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler for Express
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(e => e.message);
    statusCode = 400;
    message = messages.join(", ");
  }

  // Handle duplicate key errors (MongoDB)
  if (err.code && err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field "${field}": ${err.keyValue[field]}`;
  }

  // Log stack trace in development
  if (process.env.NODE_ENV !== "production") {
    console.error("----- Error Stack -----");
    console.error(err.stack);
    console.error("----------------------");
  }

  // Send response
  res.status(statusCode).json({
    message,
    success: false,
    status: statusCode,
    timestamp: new Date().toISOString()
  });
}

