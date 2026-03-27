import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { logger } from "../utils/logger.utils";
import { getCorrelationId } from "../middleware/correlation-id.middleware";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Map Multer errors to appropriate HTTP status codes
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(422).json({
        status: "error",
        message: "File size exceeds the allowed limit.",
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(400).json({
      status: "error",
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Map custom INVALID_MIME_TYPE error to HTTP 415
  if (err.message === "INVALID_MIME_TYPE") {
    return res.status(415).json({
      status: "error",
      message:
        "Unsupported Media Type. The uploaded file type is not accepted.",
      timestamp: new Date().toISOString(),
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error
  logger.error(`${req.method} ${req.path}`, {
    correlationId: getCorrelationId() ?? req.correlationId,
    error: message,
    statusCode,
    stack: err.stack,
    ip: req.ip,
  });

  res.status(statusCode).json({
    status: "error",
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      path: req.path,
    }),
  });
};

export const createError = (
  message: string,
  statusCode: number = 500,
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
