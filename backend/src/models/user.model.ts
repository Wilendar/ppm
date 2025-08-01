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
  role: 'USER' | 'MANAGER' | 'ADMIN';
  oauth_provider?: 'GOOGLE' | 'MICROSOFT' | null;
  oauth_id?: string | null;
  avatar_url?: string | null;
  preferences: any;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date | null;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  oauth_provider?: 'GOOGLE' | 'MICROSOFT';
  oauth_id?: string;
  avatar_url?: string;
  preferences?: any;
}

export interface UpdateUserInput {
  name?: string;
  role?: 'USER' | 'MANAGER' | 'ADMIN';
  oauth_provider?: 'GOOGLE' | 'MICROSOFT';
  oauth_id?: string;
  avatar_url?: string;
  preferences?: any;
  last_login_at?: Date;
}

export interface UserFilters {
  role?: 'USER' | 'MANAGER' | 'ADMIN';
  oauth_provider?: 'GOOGLE' | 'MICROSOFT';
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
  ADMIN: 'ADMIN' as const,
  MANAGER: 'MANAGER' as const,
  USER: 'USER' as const,
};

export const OAUTH_PROVIDERS = {
  GOOGLE: 'GOOGLE' as const,
  MICROSOFT: 'MICROSOFT' as const,
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