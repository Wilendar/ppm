/**
 * Authentication Middleware
 * Handles JWT token verification, user session management, and request authentication
 */

import { Request, Response, NextFunction } from 'express';
import { JWTService, TokenPayload } from '../services/auth/jwt.service';
import { UserService, User } from '../services/user/user.service';
import { logger } from '../utils/logger.util';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      tokenPayload?: TokenPayload;
    }
  }
}

export class AuthMiddleware {
  private jwtService: JWTService;
  private userService: UserService;

  constructor() {
    this.jwtService = new JWTService();
    this.userService = new UserService();
  }

  /**
   * Verify JWT token and authenticate user
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractTokenFromRequest(req);
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Authentication token required',
          code: 'MISSING_TOKEN',
        });
        return;
      }

      // Verify JWT token
      const tokenPayload = await this.jwtService.verifyAccessToken(token);
      
      // Get user from database
      const user = await this.userService.getUserById(tokenPayload.userId);
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      if (!user.active) {
        res.status(401).json({
          success: false,
          error: 'User account is disabled',
          code: 'USER_DISABLED',
        });
        return;
      }

      // Attach user and token payload to request
      req.user = user;
      req.tokenPayload = tokenPayload;

      next();
    } catch (error) {
      logger.warn('Authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }
  };

  /**
   * Optional authentication - allows both authenticated and unauthenticated requests
   */
  optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractTokenFromRequest(req);
      
      if (!token) {
        next();
        return;
      }

      const tokenPayload = await this.jwtService.verifyAccessToken(token);
      const user = await this.userService.getUserById(tokenPayload.userId);
      
      if (user && user.active) {
        req.user = user;
        req.tokenPayload = tokenPayload;
      }

      next();
    } catch (error) {
      // Silently fail for optional authentication
      next();
    }
  };

  /**
   * Require specific roles
   */
  requireRoles = (allowedRoles: ('admin' | 'manager' | 'user')[]): ((req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Authorization failed - insufficient role', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          path: req.path,
        });

        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            required: allowedRoles,
            current: req.user.role,
          },
        });
        return;
      }

      next();
    };
  };

  /**
   * Require specific permissions
   */
  requirePermissions = (requiredPermissions: string[]): ((req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      const userPermissions = this.userService.getUserPermissions(req.user.role);
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(permission => 
          !userPermissions.includes(permission)
        );

        logger.warn('Authorization failed - missing permissions', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermissions,
          missingPermissions,
          path: req.path,
        });

        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            required: requiredPermissions,
            missing: missingPermissions,
          },
        });
        return;
      }

      next();
    };
  };

  /**
   * Admin only access
   */
  requireAdmin = this.requireRoles(['admin']);

  /**
   * Manager or Admin access
   */
  requireManagerOrAdmin = this.requireRoles(['manager', 'admin']);

  /**
   * Authenticated user (any role)
   */
  requireAuth = this.authenticate;

  /**
   * Check if user owns resource or has admin/manager role
   */
  requireOwnershipOrElevated = (getUserIdFromParams: (req: Request) => number): ((req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      const resourceUserId = getUserIdFromParams(req);
      const isOwner = req.user.id === resourceUserId;
      const isElevated = ['admin', 'manager'].includes(req.user.role);

      if (!isOwner && !isElevated) {
        logger.warn('Authorization failed - not owner and not elevated', {
          userId: req.user.id,
          userRole: req.user.role,
          resourceUserId,
          path: req.path,
        });

        res.status(403).json({
          success: false,
          error: 'Access denied - not authorized to access this resource',
          code: 'ACCESS_DENIED',
        });
        return;
      }

      next();
    };
  };

  /**
   * Rate limiting for authentication endpoints
   */
  rateLimitAuth = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): ((req: Request, res: Response, next: NextFunction) => void) => {
    const attempts = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const key = `${req.ip}-${req.path}`;
      const now = Date.now();
      const attemptData = attempts.get(key);

      if (!attemptData || now > attemptData.resetTime) {
        attempts.set(key, { count: 1, resetTime: now + windowMs });
        next();
        return;
      }

      if (attemptData.count >= maxAttempts) {
        const retryAfter = Math.ceil((attemptData.resetTime - now) / 1000);
        
        logger.warn('Rate limit exceeded for auth endpoint', {
          ip: req.ip,
          path: req.path,
          attempts: attemptData.count,
          retryAfter,
        });

        res.status(429).json({
          success: false,
          error: 'Too many authentication attempts',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        });
        return;
      }

      attemptData.count++;
      next();
    };
  };

  /**
   * Extract token from Authorization header or cookie
   */
  private extractTokenFromRequest(req: Request): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookie (for browser requests)
    const tokenCookie = req.cookies?.access_token;
    if (tokenCookie) {
      return tokenCookie;
    }

    return null;
  }

  /**
   * Validate API key (for service-to-service communication)
   */
  validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'] as string;
    const validApiKeys = process.env.API_KEYS?.split(',') || [];

    if (!apiKey || !validApiKeys.includes(apiKey)) {
      logger.warn('Invalid API key attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      res.status(401).json({
        success: false,
        error: 'Invalid API key',
        code: 'INVALID_API_KEY',
      });
      return;
    }

    next();
  };

  /**
   * Session validation middleware
   */
  validateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.tokenPayload) {
      next();
      return;
    }

    try {
      // Check if user has active sessions
      const activeSessions = await this.jwtService.getUserActiveSessions(req.user.id);
      
      if (activeSessions.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Session validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user.id,
      });
      next();
    }
  };
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export individual middleware functions
export const authenticate = authMiddleware.authenticate;
export const optionalAuthenticate = authMiddleware.optionalAuthenticate;
export const requireRoles = authMiddleware.requireRoles;
export const requirePermissions = authMiddleware.requirePermissions;
export const requireAdmin = authMiddleware.requireAdmin;
export const requireManagerOrAdmin = authMiddleware.requireManagerOrAdmin;
export const requireAuth = authMiddleware.requireAuth;
export const requireOwnershipOrElevated = authMiddleware.requireOwnershipOrElevated;
export const rateLimitAuth = authMiddleware.rateLimitAuth;
export const validateApiKey = authMiddleware.validateApiKey;
export const validateSession = authMiddleware.validateSession;

export default authMiddleware;