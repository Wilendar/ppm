/**
 * User Model for Prisma ORM
 * Defines the User schema and related types for the PPM application
 */

// This file would typically contain Prisma model definitions
// Since we're using Prisma, the actual schema is defined in prisma/schema.prisma
// This file contains TypeScript interfaces that correspond to the Prisma models

export interface User {
  id: number;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  password_hash?: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'user';
  oauth_provider?: 'google' | 'microsoft';
  oauth_id?: string;
  oauth_data?: any;
  email_verified: boolean;
  active: boolean;
  domain?: string;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'user';
  oauth_provider?: 'google' | 'microsoft';
  oauth_id?: string;
  oauth_data?: any;
  email_verified?: boolean;
  active?: boolean;
  domain?: string;
}

export interface UpdateUserInput {
  name?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  role?: 'admin' | 'manager' | 'user';
  oauth_provider?: 'google' | 'microsoft';
  oauth_id?: string;
  oauth_data?: any;
  email_verified?: boolean;
  active?: boolean;
  domain?: string;
  last_login?: Date;
}

export interface UserFilters {
  role?: 'admin' | 'manager' | 'user';
  active?: boolean;
  oauth_provider?: 'google' | 'microsoft';
  domain?: string;
  search?: string;
}

export interface UserSession {
  id: string;
  userId: number;
  deviceInfo?: string;
  createdAt: Date;
  expiresAt: Date;
  active: boolean;
}

export interface UserPermission {
  resource: string;
  action: string;
  granted: boolean;
}

export const USER_ROLES = {
  ADMIN: 'admin' as const,
  MANAGER: 'manager' as const,
  USER: 'user' as const,
};

export const OAUTH_PROVIDERS = {
  GOOGLE: 'google' as const,
  MICROSOFT: 'microsoft' as const,
};

export const USER_PERMISSIONS = {
  // User management
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // Shop management
  SHOPS_READ: 'shops:read',
  SHOPS_CREATE: 'shops:create',
  SHOPS_UPDATE: 'shops:update',
  SHOPS_DELETE: 'shops:delete',

  // Product management
  PRODUCTS_READ: 'products:read',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_EXPORT: 'products:export',
  PRODUCTS_IMPORT: 'products:import',

  // Category management
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',

  // Image management
  IMAGES_READ: 'images:read',
  IMAGES_UPLOAD: 'images:upload',
  IMAGES_DELETE: 'images:delete',

  // Sync operations
  SYNC_READ: 'sync:read',
  SYNC_EXECUTE: 'sync:execute',

  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // Integrations
  INTEGRATIONS_READ: 'integrations:read',
  INTEGRATIONS_CREATE: 'integrations:create',
  INTEGRATIONS_UPDATE: 'integrations:update',
  INTEGRATIONS_DELETE: 'integrations:delete',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type OAuthProvider = typeof OAUTH_PROVIDERS[keyof typeof OAUTH_PROVIDERS];
export type Permission = typeof USER_PERMISSIONS[keyof typeof USER_PERMISSIONS];