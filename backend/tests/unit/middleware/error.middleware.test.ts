/**
 * Unit Tests for Error Middleware
 */

import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  UnauthorizedError,
  asyncHandler
} from '@/middleware/error.middleware';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/test',
      url: '/test',
      ip: '127.0.0.1',
      headers: {},
      body: {},
      query: {},
      params: {},
      get: jest.fn()
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('AppError', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should use default values', () => {
      const error = new AppError('Test error');
      
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with details', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', details);
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create UnauthorizedError', () => {
      const error = new UnauthorizedError();
      
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Unauthorized access');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });

    it('should handle ValidationError with details', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', details);
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          details
        }
      });
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });

    it('should handle JWT errors', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 error for unmatched routes', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'Route GET /test not found',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET'
        }
      });
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async operations', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(mockRequest, mockResponse, mockNext);
      
      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch and forward async errors', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(mockRequest, mockResponse, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});