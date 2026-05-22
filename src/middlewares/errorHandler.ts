import type { NextFunction, Request, Response } from 'express';
import type { MongoServerError } from 'mongodb';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';

interface CastError extends Error {
  path?: string;
  value?: unknown;
}

interface ValidationError extends Error {
  errors?: Record<string, { message: string }>;
}

const isCastError = (err: Error): err is CastError => err.name === 'CastError';

const isMongoServerError = (err: Error): err is MongoServerError =>
  'code' in err && (err as MongoServerError).code === 11000;

const isValidationError = (err: Error): err is ValidationError =>
  err.name === 'ValidationError';

const handleCastErrorDB = (err: CastError): AppError =>
  new AppError(`Invalid ${err.path}: ${String(err.value)}`, 400);

const handleDuplicateFieldsDB = (err: MongoServerError): AppError => {
  const keyValue = err.keyValue as Record<string, unknown> | undefined;
  const field = Object.keys(keyValue ?? {})[0] ?? 'field';
  const value = keyValue?.[field] ?? '';
  return new AppError(`Duplicate value for ${field}: ${String(value)}`, 400);
};

const handleValidationErrorDB = (err: ValidationError): AppError => {
  const messages = Object.values(err.errors ?? {}).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
};

const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response): void => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong',
  });
};

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error: AppError =
    err instanceof AppError
      ? err
      : new AppError(err.message || 'Internal server error', 500, false);

  if (isCastError(err)) error = handleCastErrorDB(err);
  if (isMongoServerError(err)) error = handleDuplicateFieldsDB(err);
  if (isValidationError(err)) error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  if (env.isDevelopment) {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

export default errorHandler;
