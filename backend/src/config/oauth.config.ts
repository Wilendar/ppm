/**
 * OAuth Configuration for Google Workspace and Microsoft Office 365
 * Supports domain restrictions and tenant validation
 */

export interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    allowedDomains: string[];
  };
  microsoft: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    callbackUrl: string;
    allowedTenants: string[];
  };
}

export const oauthConfig: OAuthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback',
    allowedDomains: process.env.GOOGLE_ALLOWED_DOMAINS?.split(',') || [],
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    tenantId: process.env.MICROSOFT_TENANT_ID || '',
    callbackUrl: process.env.MICROSOFT_CALLBACK_URL || '/api/v1/auth/microsoft/callback',
    allowedTenants: process.env.MICROSOFT_ALLOWED_TENANTS?.split(',') || [],
  },
};

export const validateOAuthConfig = (): void => {
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'MICROSOFT_CLIENT_ID',
    'MICROSOFT_CLIENT_SECRET',
    'MICROSOFT_TENANT_ID',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required OAuth environment variables: ${missingVars.join(', ')}`);
  }
};