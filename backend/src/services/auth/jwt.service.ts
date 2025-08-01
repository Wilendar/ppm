/**
 * JWT Token Management Service
 * Handles access tokens, refresh tokens, and secure token operations
 */

import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { RedisService } from '../cache/redis.service';
import { logger } from '../../utils/logger.util';

export interface TokenPayload {
  userId: number;
  email: string;
  role: 'admin' | 'manager' | 'user';
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface RefreshTokenData {
  userId: number;
  email: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: string;
  deviceInfo?: string;
}

export class JWTService {
  private readonly redisService: RedisService;
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly issuer: string;
  private readonly audience: string;

  constructor() {
    this.redisService = new RedisService();
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    this.issuer = 'ppm-api';
    this.audience = 'ppm-frontend';

    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets are required in environment variables');
    }

    if (this.accessTokenSecret.length < 32 || this.refreshTokenSecret.length < 32) {
      throw new Error('JWT secrets must be at least 32 characters long');
    }
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokens(
    userId: number,
    email: string,
    role: 'admin' | 'manager' | 'user',
    deviceInfo?: string
  ): Promise<TokenPair> {
    const payload = { userId, email, role };

    // Generate access token
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256',
    } as jwt.SignOptions);

    // Generate refresh token
    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256',
    } as jwt.SignOptions);

    // Store refresh token in Redis
    await this.storeRefreshToken(refreshToken, {
      userId,
      email,
      role,
      createdAt: new Date().toISOString(),
      deviceInfo,
    });

    // Store active session mapping
    await this.updateUserSession(userId, refreshToken);

    const expiresIn = this.parseExpiryToSeconds(this.accessTokenExpiry);

    logger.info('JWT tokens generated', {
      userId,
      email,
      role,
      expiresIn,
      deviceInfo,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256'],
      }) as TokenPayload;

      return payload;
    } catch (error) {
      logger.warn('Access token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: token.substring(0, 20) + '...',
      });
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string, deviceInfo?: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.refreshTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256'],
      }) as TokenPayload;

      // Check if refresh token exists in Redis
      const storedData = await this.getRefreshTokenData(refreshToken);
      if (!storedData) {
        throw new Error('Refresh token not found or expired');
      }

      // Verify user data consistency
      if (storedData.userId !== payload.userId || storedData.email !== payload.email) {
        throw new Error('Refresh token data inconsistency');
      }

      // Revoke old refresh token
      await this.revokeRefreshToken(refreshToken);

      // Generate new token pair
      const newTokens = await this.generateTokens(
        payload.userId,
        payload.email,
        payload.role,
        deviceInfo || storedData.deviceInfo
      );

      logger.info('Tokens refreshed successfully', {
        userId: payload.userId,
        email: payload.email,
        deviceInfo,
      });

      return newTokens;
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        refreshToken: refreshToken.substring(0, 20) + '...',
      });
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.redisService.del(`refresh_token:${tokenHash}`);
    
    logger.info('Refresh token revoked', {
      tokenHash: tokenHash.substring(0, 16) + '...',
    });
  }

  /**
   * Revoke all user tokens (logout from all devices)
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    const sessionKey = `user_session:${userId}`;
    const activeTokens = await this.redisService.smembers(sessionKey);

    if (activeTokens && activeTokens.length > 0) {
      const pipeline = this.redisService.pipeline();
      
      // Remove all refresh tokens
      activeTokens.forEach(tokenHash => {
        pipeline.del(`refresh_token:${tokenHash}`);
      });
      
      // Remove session set
      pipeline.del(sessionKey);
      
      await pipeline.exec();
    }

    logger.info('All user tokens revoked', { userId, tokensCount: activeTokens?.length || 0 });
  }

  /**
   * Get active sessions for user
   */
  async getUserActiveSessions(userId: number): Promise<RefreshTokenData[]> {
    const sessionKey = `user_session:${userId}`;
    const activeTokenHashes = await this.redisService.smembers(sessionKey);

    if (!activeTokenHashes || activeTokenHashes.length === 0) {
      return [];
    }

    const sessions: RefreshTokenData[] = [];
    
    for (const tokenHash of activeTokenHashes) {
      const sessionData = await this.redisService.get<RefreshTokenData>(`refresh_token:${tokenHash}`);
      if (sessionData) {
        sessions.push(sessionData);
      }
    }

    return sessions;
  }

  /**
   * Store refresh token in Redis
   */
  private async storeRefreshToken(refreshToken: string, data: RefreshTokenData): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expirySeconds = this.parseExpiryToSeconds(this.refreshTokenExpiry);
    
    await this.redisService.setex(`refresh_token:${tokenHash}`, expirySeconds, data);
  }

  /**
   * Get refresh token data from Redis
   */
  private async getRefreshTokenData(refreshToken: string): Promise<RefreshTokenData | null> {
    const tokenHash = this.hashToken(refreshToken);
    return await this.redisService.get<RefreshTokenData>(`refresh_token:${tokenHash}`);
  }

  /**
   * Update user active session
   */
  private async updateUserSession(userId: number, refreshToken: string): Promise<void> {
    const sessionKey = `user_session:${userId}`;
    const tokenHash = this.hashToken(refreshToken);
    const expirySeconds = this.parseExpiryToSeconds(this.refreshTokenExpiry);

    await this.redisService.sadd(sessionKey, tokenHash);
    await this.redisService.expire(sessionKey, expirySeconds);
  }

  /**
   * Hash token for secure storage
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  /**
   * Generate secure random token for additional security operations
   */
  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Clean up expired tokens (should be called periodically)
   */
  async cleanupExpiredTokens(): Promise<void> {
    // This would typically be handled by Redis TTL
    // but we can implement additional cleanup logic here if needed
    logger.info('Token cleanup completed');
  }
}