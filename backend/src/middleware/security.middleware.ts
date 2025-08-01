/**
 * Security Middleware
 * Provides CSRF protection, secure headers, rate limiting, and other security features
 */

import { Request, Response, NextFunction } from 'express';
import { createHash, randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import { RedisService } from '../services/cache/redis.service';
import { User } from '../models/user.model';
import { logger } from '../utils/logger.util';

export class SecurityMiddleware {
  private redisService: RedisService;
  private csrfTokens: Map<string, { token: string; expiry: number }>;

  constructor() {
    this.redisService = new RedisService();
    this.csrfTokens = new Map();
  }

  /**
   * CSRF Protection Middleware
   */
  csrfProtection = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Skip CSRF for safe methods and API keys
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.headers['x-api-key']) {
        next();
        return;
      }

      try {
        const token = req.headers['x-csrf-token'] as string || req.body._csrf;
        const sessionId = this.getSessionId(req);

        if (!token || !sessionId) {
          res.status(403).json({
            success: false,
            error: 'CSRF token required',
            code: 'CSRF_TOKEN_REQUIRED',
          });
          return;
        }

        const isValid = await this.validateCSRFToken(sessionId, token);
        if (!isValid) {
          logger.warn('CSRF token validation failed', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            sessionId: sessionId.substring(0, 8) + '...',
          });

          res.status(403).json({
            success: false,
            error: 'Invalid CSRF token',
            code: 'INVALID_CSRF_TOKEN',
          });
          return;
        }

        next();
      } catch (error) {
        logger.error('CSRF protection error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
        });
      }
    };
  };

  /**
   * Generate CSRF token for session
   */
  generateCSRFToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = this.getSessionId(req);
      if (!sessionId) {
        next();
        return;
      }

      const token = randomBytes(32).toString('hex');
      const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

      await this.redisService.setex(`csrf:${sessionId}`, 24 * 60 * 60, token);
      
      res.locals.csrfToken = token;
      next();
    } catch (error) {
      logger.error('CSRF token generation error:', error);
      next();
    }
  };

  /**
   * Security Headers Middleware
   */
  securityHeaders = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Content Security Policy
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';"
      );

      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');

      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // XSS Protection
      res.setHeader('X-XSS-Protection', '1; mode=block');

      // Referrer Policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Permissions Policy
      res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=()'
      );

      // Remove X-Powered-By header
      res.removeHeader('X-Powered-By');

      // HSTS (if HTTPS)
      if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains; preload'
        );
      }

      next();
    };
  };

  /**
   * Rate Limiting for API endpoints
   */
  createRateLimit = (options: {
    windowMs?: number;
    max?: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
  } = {}) => {
    return rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      max: options.max || 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: options.message || 'Too many requests from this IP',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      keyGenerator: options.keyGenerator || ((req: Request) => req.ip),
      handler: (req: Request, res: Response) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          limit: options.max,
        });

        res.status(429).json({
          success: false,
          error: options.message || 'Too many requests from this IP',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.round(options.windowMs! / 1000) || 900,
        });
      },
    });
  };

  /**
   * Strict rate limiting for authentication endpoints
   */
  authRateLimit = this.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true,
  });

  /**
   * Moderate rate limiting for API endpoints
   */
  apiRateLimit = this.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'API rate limit exceeded',
  });

  /**
   * Lenient rate limiting for public endpoints
   */
  publicRateLimit = this.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please slow down',
  });

  /**
   * User-specific rate limiting
   */
  userRateLimit = (options: { windowMs?: number; max?: number } = {}) => {
    return this.createRateLimit({
      ...options,
      keyGenerator: (req: Request) => {
        // Use user ID if authenticated, otherwise fall back to IP
        return req.user ? `user:${(req.user as any).id}` : req.ip;
      },
    });
  };

  /**
   * Validate request origin
   */
  validateOrigin = (allowedOrigins: string[] | string = '*') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const origin = req.headers.origin;

      if (allowedOrigins === '*') {
        next();
        return;
      }

      const origins = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];

      if (!origin || !origins.includes(origin)) {
        logger.warn('Invalid origin blocked', {
          origin,
          ip: req.ip,
          path: req.path,
          allowedOrigins: origins,
        });

        res.status(403).json({
          success: false,
          error: 'Origin not allowed',
          code: 'INVALID_ORIGIN',
        });
        return;
      }

      next();
    };
  };

  /**
   * Request size limiting
   */
  requestSizeLimit = (maxSizeBytes: number = 10 * 1024 * 1024) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);

      if (contentLength > maxSizeBytes) {
        logger.warn('Request size limit exceeded', {
          contentLength,
          maxSize: maxSizeBytes,
          ip: req.ip,
          path: req.path,
        });

        res.status(413).json({
          success: false,
          error: 'Request entity too large',
          code: 'REQUEST_TOO_LARGE',
          maxSize: maxSizeBytes,
        });
        return;
      }

      next();
    };
  };

  /**
   * IP Whitelist/Blacklist
   */
  ipFilter = (options: { whitelist?: string[]; blacklist?: string[] }) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientIP = req.ip;

      // Check blacklist first
      if (options.blacklist && options.blacklist.includes(clientIP)) {
        logger.warn('Blocked IP attempt', {
          ip: clientIP,
          path: req.path,
          userAgent: req.get('User-Agent'),
        });

        res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'IP_BLOCKED',
        });
        return;
      }

      // Check whitelist if provided
      if (options.whitelist && !options.whitelist.includes(clientIP)) {
        logger.warn('Non-whitelisted IP blocked', {
          ip: clientIP,
          path: req.path,
          whitelist: options.whitelist,
        });

        res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'IP_NOT_WHITELISTED',
        });
        return;
      }

      next();
    };
  };

  /**
   * Request signature validation (for webhooks)
   */
  validateSignature = (secretKey: string, headerName: string = 'x-signature') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const signature = req.headers[headerName] as string;
      const body = JSON.stringify(req.body);

      if (!signature) {
        res.status(401).json({
          success: false,
          error: 'Signature required',
          code: 'SIGNATURE_REQUIRED',
        });
        return;
      }

      const expectedSignature = createHash('sha256')
        .update(body + secretKey)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');

      if (expectedSignature !== providedSignature) {
        logger.warn('Invalid signature', {
          ip: req.ip,
          path: req.path,
          expected: expectedSignature.substring(0, 8) + '...',
          provided: providedSignature.substring(0, 8) + '...',
        });

        res.status(401).json({
          success: false,
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE',
        });
        return;
      }

      next();
    };
  };

  /**
   * Honeypot field validation
   */
  honeypotProtection = (fieldName: string = '_hp') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (req.body && req.body[fieldName]) {
        logger.warn('Honeypot triggered', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
        });

        // Silently reject (don't let bots know they triggered honeypot)
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          code: 'INVALID_REQUEST',
        });
        return;
      }

      next();
    };
  };

  /**
   * Private methods
   */
  private getSessionId(req: Request): string | null {
    return req.sessionID || req.headers['x-session-id'] as string || null;
  }

  private async validateCSRFToken(sessionId: string, token: string): Promise<boolean> {
    try {
      const storedToken = await this.redisService.get<string>(`csrf:${sessionId}`);
      return storedToken === token;
    } catch (error) {
      logger.error('CSRF token validation error:', error);
      return false;
    }
  }
}

// Create singleton instance
const securityMiddleware = new SecurityMiddleware();

// Export individual middleware functions
export const csrfProtection = securityMiddleware.csrfProtection;
export const generateCSRFToken = securityMiddleware.generateCSRFToken;
export const securityHeaders = securityMiddleware.securityHeaders;
export const authRateLimit = securityMiddleware.authRateLimit;
export const apiRateLimit = securityMiddleware.apiRateLimit;
export const publicRateLimit = securityMiddleware.publicRateLimit;
export const userRateLimit = securityMiddleware.userRateLimit;
export const validateOrigin = securityMiddleware.validateOrigin;
export const requestSizeLimit = securityMiddleware.requestSizeLimit;
export const ipFilter = securityMiddleware.ipFilter;
export const validateSignature = securityMiddleware.validateSignature;
export const honeypotProtection = securityMiddleware.honeypotProtection;

export default securityMiddleware;