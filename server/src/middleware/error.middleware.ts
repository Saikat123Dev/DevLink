import { NextFunction, Request, Response } from 'express';

interface ErrorWithStatus extends Error {
  statusCode?: number;
  status?: number;
}

export const errorHandler = (
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal Server Error';

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database operation failed';
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`Error ${statusCode}: ${message}`);
    console.error(error.stack);
  }

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};
