/**
 * Validation Middleware
 * Express-validator wrapper for request validation
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger.util';

/**
 * Validation middleware that checks express-validator results
 */
export const validationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: (error as any).param || (error as any).path,
      message: error.msg,
      value: (error as any).value,
    }));

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errorDetails,
      ip: req.ip,
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errorDetails,
    });
    return;
  }

  next();
};

/**
 * Create validation middleware with custom error handler
 */
export const createValidationMiddleware = (customHandler?: (errors: any[]) => any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorArray = errors.array();
      
      if (customHandler) {
        const customResponse = customHandler(errorArray);
        res.status(400).json(customResponse);
        return;
      }

      const errorDetails = errorArray.map(error => ({
        field: (error as any).param || (error as any).path,
        message: error.msg,
        value: (error as any).value,
      }));

      logger.warn('Validation failed', {
        path: req.path,
        method: req.method,
        errors: errorDetails,
        ip: req.ip,
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errorDetails,
      });
      return;
    }

    next();
  };
};

export default validationMiddleware;