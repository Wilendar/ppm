/**
 * OAuth Service for Google Workspace and Microsoft Office 365 integration
 * Handles user authentication, domain/tenant restrictions, and user provisioning
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { oauthConfig } from '../../config/oauth.config';
import { UserService } from '../user/user.service';
import { JWTService } from './jwt.service';
import { logger } from '../../utils/logger.util';

export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: 'google' | 'microsoft';
  providerData: {
    accessToken: string;
    refreshToken?: string;
    profile: any;
  };
  domainInfo?: {
    domain: string;
    isVerified: boolean;
  };
}

export interface OAuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
  isNewUser: boolean;
}

export class OAuthService {
  private userService: UserService;
  private jwtService: JWTService;

  constructor() {
    this.userService = new UserService();
    this.jwtService = new JWTService();
    this.initializeStrategies();
  }

  /**
   * Initialize OAuth strategies for Passport
   */
  private initializeStrategies(): void {
    this.initializeGoogleStrategy();
    this.initializeMicrosoftStrategy();
    this.setupPassportSerialization();
  }

  /**
   * Initialize Google OAuth Strategy
   */
  private initializeGoogleStrategy(): void {
    passport.use(
      new GoogleStrategy(
        {
          clientID: oauthConfig.google.clientId,
          clientSecret: oauthConfig.google.clientSecret,
          callbackURL: oauthConfig.google.callbackUrl,
          scope: ['profile', 'email'],
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const oauthProfile = await this.processGoogleProfile(
              accessToken,
              refreshToken,
              profile
            );
            
            const user = await this.handleOAuthCallback(oauthProfile);
            done(null, user);
          } catch (error) {
            logger.error('Google OAuth authentication failed:', error);
            done(error, false);
          }
        }
      )
    );
  }

  /**
   * Initialize Microsoft OAuth Strategy
   */
  private initializeMicrosoftStrategy(): void {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: oauthConfig.microsoft.clientId,
          clientSecret: oauthConfig.microsoft.clientSecret,
          callbackURL: oauthConfig.microsoft.callbackUrl,
          tenant: oauthConfig.microsoft.tenantId,
          scope: ['openid', 'profile', 'email', 'User.Read'],
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const oauthProfile = await this.processMicrosoftProfile(
              accessToken,
              refreshToken,
              profile
            );
            
            const user = await this.handleOAuthCallback(oauthProfile);
            done(null, user);
          } catch (error) {
            logger.error('Microsoft OAuth authentication failed:', error);
            done(error, false);
          }
        }
      )
    );
  }

  /**
   * Setup Passport serialization
   */
  private setupPassportSerialization(): void {
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: number, done) => {
      try {
        const user = await this.userService.getUserById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  /**
   * Process Google OAuth profile
   */
  private async processGoogleProfile(
    accessToken: string,
    refreshToken: string | undefined,
    profile: any
  ): Promise<OAuthProfile> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new Error('Email not provided by Google OAuth');
    }

    // Extract domain from email
    const domain = email.split('@')[1];
    
    // Check domain restrictions
    if (oauthConfig.google.allowedDomains.length > 0) {
      if (!oauthConfig.google.allowedDomains.includes(domain)) {
        throw new Error(`Domain ${domain} is not allowed for Google OAuth authentication`);
      }
    }

    return {
      id: profile.id,
      email,
      name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      avatar: profile.photos?.[0]?.value,
      provider: 'google',
      providerData: {
        accessToken,
        refreshToken,
        profile,
      },
      domainInfo: {
        domain,
        isVerified: profile.emails?.[0]?.verified || false,
      },
    };
  }

  /**
   * Process Microsoft OAuth profile
   */
  private async processMicrosoftProfile(
    accessToken: string,
    refreshToken: string | undefined,
    profile: any
  ): Promise<OAuthProfile> {
    const email = profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName;
    if (!email) {
      throw new Error('Email not provided by Microsoft OAuth');
    }

    // Extract tenant from profile if available
    const tenantId = profile._json?.tid;
    
    // Check tenant restrictions
    if (oauthConfig.microsoft.allowedTenants.length > 0 && tenantId) {
      if (!oauthConfig.microsoft.allowedTenants.includes(tenantId)) {
        throw new Error(`Tenant ${tenantId} is not allowed for Microsoft OAuth authentication`);
      }
    }

    const domain = email.split('@')[1];

    return {
      id: profile.id,
      email,
      name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      avatar: profile._json?.picture,
      provider: 'microsoft',
      providerData: {
        accessToken,
        refreshToken,
        profile,
      },
      domainInfo: {
        domain,
        isVerified: true, // Microsoft emails are generally considered verified
      },
    };
  }

  /**
   * Handle OAuth callback and user provisioning
   */
  private async handleOAuthCallback(profile: OAuthProfile): Promise<OAuthUser> {
    try {
      // Check if user already exists
      let user = await this.userService.getUserByEmail(profile.email);
      let isNewUser = false;

      if (!user) {
        // Create new user
        const role = this.determineUserRole(profile.email, profile.domainInfo?.domain);
        
        user = await this.userService.createUser({
          email: profile.email,
          name: profile.name,
          avatar_url: profile.avatar,
          role: role.toUpperCase() as any,
          oauth_provider: profile.provider.toUpperCase() as any,
          oauth_id: profile.id,
          preferences: profile.providerData || {},
        });

        isNewUser = true;
        
        logger.info('New user created via OAuth', {
          userId: user.id,
          email: user.email,
          provider: profile.provider,
          role: user.role,
          domain: profile.domainInfo?.domain,
        });
      } else {
        // Update existing user's OAuth data
        await this.userService.updateUser(user.id, {
          oauth_provider: profile.provider.toUpperCase() as any,
          oauth_id: profile.id,
          preferences: profile.providerData || {},
          last_login_at: new Date(),
          avatar_url: profile.avatar || (user as any).avatar_url,
        });

        logger.info('Existing user authenticated via OAuth', {
          userId: user.id,
          email: user.email,
          provider: profile.provider,
        });
      }

      // Check if user is active
      if (!user.active) {
        throw new Error('User account is disabled');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'admin' | 'manager' | 'user',
        avatar: user.avatar,
        isNewUser,
      };
    } catch (error) {
      logger.error('OAuth callback handling failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: profile.email,
        provider: profile.provider,
      });
      throw error;
    }
  }

  /**
   * Determine user role based on email and domain
   */
  private determineUserRole(email: string, domain?: string): 'admin' | 'manager' | 'user' {
    // Check admin emails
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (adminEmails.some(adminEmail => adminEmail.trim().toLowerCase() === email.toLowerCase())) {
      return 'admin';
    }

    // Check manager emails
    const managerEmails = process.env.MANAGER_EMAILS?.split(',') || [];
    if (managerEmails.some(managerEmail => managerEmail.trim().toLowerCase() === email.toLowerCase())) {
      return 'manager';
    }

    // Check admin domains
    const adminDomains = process.env.ADMIN_DOMAINS?.split(',') || [];
    if (domain && adminDomains.some(adminDomain => adminDomain.trim().toLowerCase() === domain.toLowerCase())) {
      return 'admin';
    }

    // Check manager domains
    const managerDomains = process.env.MANAGER_DOMAINS?.split(',') || [];
    if (domain && managerDomains.some(managerDomain => managerDomain.trim().toLowerCase() === domain.toLowerCase())) {
      return 'manager';
    }

    // Default role
    return 'user';
  }

  /**
   * Generate authentication URL for Google
   */
  getGoogleAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: oauthConfig.google.clientId,
      redirect_uri: oauthConfig.google.callbackUrl,
      scope: 'openid profile email',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Generate authentication URL for Microsoft
   */
  getMicrosoftAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: oauthConfig.microsoft.clientId,
      redirect_uri: oauthConfig.microsoft.callbackUrl,
      scope: 'openid profile email User.Read',
      response_type: 'code',
      response_mode: 'query',
    });

    if (state) {
      params.append('state', state);
    }

    const tenantId = oauthConfig.microsoft.tenantId || 'common';
    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Validate OAuth configuration
   */
  validateConfiguration(): void {
    const requiredGoogleConfig = ['clientId', 'clientSecret', 'callbackUrl'];
    const requiredMicrosoftConfig = ['clientId', 'clientSecret', 'callbackUrl'];

    for (const key of requiredGoogleConfig) {
      if (!oauthConfig.google[key as keyof typeof oauthConfig.google]) {
        throw new Error(`Google OAuth configuration missing: ${key}`);
      }
    }

    for (const key of requiredMicrosoftConfig) {
      if (!oauthConfig.microsoft[key as keyof typeof oauthConfig.microsoft]) {
        throw new Error(`Microsoft OAuth configuration missing: ${key}`);
      }
    }

    logger.info('OAuth configuration validated successfully');
  }

  /**
   * Get OAuth provider statistics
   */
  async getOAuthStats(): Promise<{
    google: { users: number; domains: string[] };
    microsoft: { users: number; tenants: string[] };
  }> {
    const stats = await this.userService.getOAuthStats();
    return stats;
  }
}