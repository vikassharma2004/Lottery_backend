// utils/error-utils.js (ESM)
import logger from "../config/logger.js";

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    err.statusCode = 400;
    err.message = messages.join(", ");
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err.statusCode = 400;
    err.message = `Duplicate value for "${field}": ${err.keyValue[field]}`;
  }

  // 🔥 Log EVERY error — even in production
  logger.error({
    message: err.message,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Send controlled response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    status: err.statusCode || 500,
    timestamp: new Date().toISOString(),
  });
}
