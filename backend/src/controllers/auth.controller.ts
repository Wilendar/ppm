/**
 * Authentication Controller
 * Handles OAuth authentication, token management, and user session operations
 */

import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { OAuthService } from '../services/auth/oauth.service';
import { JWTService } from '../services/auth/jwt.service';
import { UserService } from '../services/user/user.service';
import { User } from '../models/user.model';
import { logger } from '../utils/logger.util';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export class AuthController {
  private oauthService: OAuthService;
  private jwtService: JWTService;
  private userService: UserService;

  constructor() {
    this.oauthService = new OAuthService();
    this.jwtService = new JWTService();
    this.userService = new UserService();
  }

  /**
   * Initiate Google OAuth authentication
   */
  googleAuth = (req: Request, res: Response, next: NextFunction): void => {
    const state = req.query.state as string;
    
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state,
    })(req, res, next);
  };

  /**
   * Handle Google OAuth callback
   */
  googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    passport.authenticate('google', { session: false }, async (err, user, info) => {
      try {
        if (err) {
          logger.error('Google OAuth error:', err);
          return this.redirectWithError(res, 'oauth_error', 'Authentication failed');
        }

        if (!user) {
          logger.warn('Google OAuth failed - no user returned', { info });
          return this.redirectWithError(res, 'oauth_failed', 'Authentication failed');
        }

        const tokens = await this.jwtService.generateTokens(
          user.id,
          user.email,
          user.role,
          this.getDeviceInfo(req)
        );

        // Set secure HTTP-only cookie for browser requests
        this.setAuthCookies(res, tokens);

        // Log successful authentication
        logger.info('Google OAuth authentication successful', {
          userId: user.id,
          email: user.email,
          isNewUser: user.isNewUser,
        });

        // Redirect to frontend with success
        const redirectUrl = this.buildRedirectUrl('success', {
          isNewUser: user.isNewUser,
          role: user.role,
        });

        res.redirect(redirectUrl);
      } catch (error) {
        logger.error('Google OAuth callback error:', error);
        this.redirectWithError(res, 'oauth_error', 'Authentication processing failed');
      }
    })(req, res, next);
  };

  /**
   * Initiate Microsoft OAuth authentication
   */
  microsoftAuth = (req: Request, res: Response, next: NextFunction): void => {
    const state = req.query.state as string;
    
    passport.authenticate('microsoft', {
      scope: ['openid', 'profile', 'email', 'User.Read'],
      state,
    })(req, res, next);
  };

  /**
   * Handle Microsoft OAuth callback
   */
  microsoftCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    passport.authenticate('microsoft', { session: false }, async (err, user, info) => {
      try {
        if (err) {
          logger.error('Microsoft OAuth error:', err);
          return this.redirectWithError(res, 'oauth_error', 'Authentication failed');
        }

        if (!user) {
          logger.warn('Microsoft OAuth failed - no user returned', { info });
          return this.redirectWithError(res, 'oauth_failed', 'Authentication failed');
        }

        const tokens = await this.jwtService.generateTokens(
          user.id,
          user.email,
          user.role,
          this.getDeviceInfo(req)
        );

        // Set secure HTTP-only cookie for browser requests
        this.setAuthCookies(res, tokens);

        // Log successful authentication
        logger.info('Microsoft OAuth authentication successful', {
          userId: user.id,
          email: user.email,
          isNewUser: user.isNewUser,
        });

        // Redirect to frontend with success
        const redirectUrl = this.buildRedirectUrl('success', {
          isNewUser: user.isNewUser,
          role: user.role,
        });

        res.redirect(redirectUrl);
      } catch (error) {
        logger.error('Microsoft OAuth callback error:', error);
        this.redirectWithError(res, 'oauth_error', 'Authentication processing failed');
      }
    })(req, res, next);
  };

  /**
   * Refresh access token using refresh token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refresh_token;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token required',
          code: 'REFRESH_TOKEN_REQUIRED',
        });
        return;
      }

      const tokens = await this.jwtService.refreshTokens(
        refreshToken,
        this.getDeviceInfo(req)
      );

      // Update cookies
      this.setAuthCookies(res, tokens);

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
          tokenType: tokens.tokenType,
        },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      logger.error('Token refresh failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }
  };

  /**
   * Get current authenticated user information
   */
  getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      // Get fresh user data
      const user = await this.userService.getUserById((req.user as any).id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      // Get user permissions
      const permissions = this.userService.getUserPermissions(user.role);

      // Get active sessions count
      const activeSessions = await this.jwtService.getUserActiveSessions(user.id);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.first_name,
            lastName: user.last_name,
            avatar: user.avatar,
            role: user.role,
            emailVerified: user.email_verified,
            domain: user.domain,
            oauthProvider: user.oauth_provider,
            lastLogin: user.last_login,
            createdAt: user.created_at,
          },
          permissions,
          activeSessions: activeSessions.length,
        },
        message: 'User information retrieved successfully',
      });
    } catch (error) {
      logger.error('Get user info failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req.user as any)?.id,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user information',
        code: 'INTERNAL_ERROR',
      });
    }
  };

  /**
   * Logout user (single device)
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refresh_token;

      if (refreshToken) {
        await this.jwtService.revokeRefreshToken(refreshToken);
      }

      // Clear cookies
      this.clearAuthCookies(res);

      logger.info('User logged out', {
        userId: (req.user as any)?.id,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Logout failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req.user as any)?.id,
      });

      // Clear cookies anyway
      this.clearAuthCookies(res);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    }
  };

  /**
   * Logout from all devices
   */
  logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      await this.jwtService.revokeAllUserTokens((req.user as any).id);

      // Clear cookies
      this.clearAuthCookies(res);

      logger.info('User logged out from all devices', {
        userId: (req.user as any).id,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      logger.error('Logout all failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req.user as any)?.id,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to logout from all devices',
        code: 'INTERNAL_ERROR',
      });
    }
  };

  /**
   * Get user's active sessions
   */
  getActiveSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      const sessions = await this.jwtService.getUserActiveSessions((req.user as any).id);

      res.json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            deviceInfo: session.deviceInfo,
            createdAt: session.createdAt,
            // Don't expose sensitive token data
          })),
          total: sessions.length,
        },
        message: 'Active sessions retrieved successfully',
      });
    } catch (error) {
      logger.error('Get active sessions failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req.user as any)?.id,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve active sessions',
        code: 'INTERNAL_ERROR',
      });
    }
  };

  /**
   * Validate token endpoint (for frontend token validation)
   */
  validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.body.token || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Token required',
          code: 'TOKEN_REQUIRED',
        });
        return;
      }

      const payload = await this.jwtService.verifyAccessToken(token);
      const user = await this.userService.getUserById(payload.userId);

      if (!user || !user.active) {
        res.status(401).json({
          success: false,
          error: 'Invalid token or user not found',
          code: 'INVALID_TOKEN',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          expiresAt: new Date(payload.exp * 1000),
        },
        message: 'Token is valid',
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }
  };

  /**
   * Get OAuth authentication URLs
   */
  getAuthUrls = (req: Request, res: Response): void => {
    const state = req.query.state as string;

    res.json({
      success: true,
      data: {
        google: this.oauthService.getGoogleAuthUrl(state),
        microsoft: this.oauthService.getMicrosoftAuthUrl(state),
      },
      message: 'OAuth URLs generated successfully',
    });
  };

  /**
   * Private helper methods
   */
  private setAuthCookies(res: Response, tokens: any): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = process.env.COOKIE_DOMAIN;

    // Set access token cookie (shorter expiry)
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: tokens.expiresIn * 1000,
      domain,
    });

    // Set refresh token cookie (longer expiry)
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain,
    });
  }

  private clearAuthCookies(res: Response): void {
    const domain = process.env.COOKIE_DOMAIN;

    res.clearCookie('access_token', { domain });
    res.clearCookie('refresh_token', { domain });
  }

  private getDeviceInfo(req: Request): string {
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip;
    return `${userAgent.substring(0, 100)} (${ip})`;
  }

  private buildRedirectUrl(status: 'success' | 'error', params: Record<string, any> = {}): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const searchParams = new URLSearchParams({
      status,
      ...params,
    });

    return `${baseUrl}/auth/callback?${searchParams.toString()}`;
  }

  private redirectWithError(res: Response, code: string, message: string): void {
    const redirectUrl = this.buildRedirectUrl('error', { code, message });
    res.redirect(redirectUrl);
  }
}