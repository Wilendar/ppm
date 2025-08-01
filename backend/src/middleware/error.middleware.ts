/**
 * Error Handling Middleware for PPM Backend
 * Centralized error handling with structured logging and proper HTTP status codes
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/types/api.types';

// Custom Error Classes
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public details: any;

  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error', service?: string) {
    super(message, 502, `EXTERNAL_SERVICE_ERROR${service ? `_${service.toUpperCase()}` : ''}`);
  }
}

// Error Handler Middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    
    if (error instanceof ValidationError) {
      details = error.details;
    }
  } else if (error.name === 'ValidationError') {
    // Mongoose/Joi validation errors
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = error.message;
  } else if (error.name === 'CastError') {
    // Database cast errors
    statusCode = 400;
    code = 'INVALID_DATA_FORMAT';
    message = 'Invalid data format';
  } else if (error.name === 'MongoError' || error.name === 'PostgresError') {
    // Database errors
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    // JWT expiration
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  } else if (error.name === 'MulterError') {
    // File upload errors
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    message = `File upload failed: ${error.message}`;
  }

  // Log error details
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code,
      statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    user: (req as any).user ? {
      id: (req as any).user.id,
      email: (req as any).user.email,
      role: (req as any).user.role
    } : undefined
  };

  // Log based on severity
  if (statusCode >= 500) {
    console.error('Server Error:', errorLog);
  } else if (statusCode >= 400) {
    console.warn('Client Error:', errorLog);
  }

  // Prepare error response
  const errorResponse: ApiError = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      ...(details && { details })
    }
  };

  // Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    // Remove stack traces and sensitive details
    if (statusCode >= 500) {
      errorResponse.error.message = 'Internal server error';
    }
  } else {
    // Include stack trace in development
    (errorResponse.error as any).stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// 404 Handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ApiError = {
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };

  res.status(404).json(errorResponse);
};

// Async Error Handler Wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request Timeout Handler
export const timeoutHandler = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      const error = new AppError(
        'Request timeout',
        408,
        'REQUEST_TIMEOUT'
      );
      next(error);
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};