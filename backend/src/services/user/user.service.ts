/**
 * User Service for managing user data and operations
 * Handles user CRUD operations, authentication, and authorization
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../../utils/logger.util';

const prisma = new PrismaClient();

export interface CreateUserData {
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

export interface UpdateUserData {
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
  last_login?: Date;
  domain?: string;
}

export interface UserFilters {
  role?: 'admin' | 'manager' | 'user';
  active?: boolean;
  oauth_provider?: 'google' | 'microsoft';
  domain?: string;
  search?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
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

export class UserService {
  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error(`User with email ${userData.email} already exists`);
      }

      // Hash password if provided
      let hashedPassword: string | undefined;
      if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, 12);
      }

      const user = await prisma.user.create({
        data: {
          email: userData.email.toLowerCase().trim(),
          name: userData.name.trim(),
          first_name: userData.first_name?.trim(),
          last_name: userData.last_name?.trim(),
          password_hash: hashedPassword,
          avatar: userData.avatar,
          role: userData.role,
          oauth_provider: userData.oauth_provider,
          oauth_id: userData.oauth_id,
          oauth_data: userData.oauth_data,
          email_verified: userData.email_verified || false,
          active: userData.active !== undefined ? userData.active : true,
          domain: userData.domain?.toLowerCase(),
        },
      });

      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        oauth_provider: user.oauth_provider,
      });

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Failed to create user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: userData.email,
      });
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      logger.error('Failed to get user by ID:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: id,
      });
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      logger.error('Failed to get user by email:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
      });
      return null;
    }
  }

  /**
   * Get user by OAuth provider and ID
   */
  async getUserByOAuth(provider: 'google' | 'microsoft', oauthId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          oauth_provider: provider,
          oauth_id: oauthId,
        },
      });

      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      logger.error('Failed to get user by OAuth:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        provider,
        oauthId,
      });
      return null;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: number, updateData: UpdateUserData): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...updateData,
          name: updateData.name?.trim(),
          first_name: updateData.first_name?.trim(),
          last_name: updateData.last_name?.trim(),
          domain: updateData.domain?.toLowerCase(),
          updated_at: new Date(),
        },
      });

      logger.info('User updated successfully', {
        userId: user.id,
        email: user.email,
        updatedFields: Object.keys(updateData),
      });

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Failed to update user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: id,
      });
      throw error;
    }
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  async deleteUser(id: number): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          active: false,
          updated_at: new Date(),
        },
      });

      logger.info('User deactivated successfully', { userId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: id,
      });
      return false;
    }
  }

  /**
   * Get users with filtering and pagination
   */
  async getUsers(
    page: number = 1,
    limit: number = 20,
    filters: UserFilters = {}
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      const where: any = {};

      if (filters.role) {
        where.role = filters.role;
      }

      if (filters.active !== undefined) {
        where.active = filters.active;
      }

      if (filters.oauth_provider) {
        where.oauth_provider = filters.oauth_provider;
      }

      if (filters.domain) {
        where.domain = filters.domain.toLowerCase();
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      const sanitizedUsers = users.map(user => this.sanitizeUser(user));

      return {
        users: sanitizedUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get users:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
      });
      throw error;
    }
  }

  /**
   * Verify user password
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user || !user.password_hash) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return null;
      }

      // Update last login
      await this.updateUser(user.id, { last_login: new Date() });

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Failed to verify password:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
      });
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(id: number, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id },
        data: {
          password_hash: hashedPassword,
          updated_at: new Date(),
        },
      });

      logger.info('User password changed successfully', { userId: id });
      return true;
    } catch (error) {
      logger.error('Failed to change password:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: id,
      });
      return false;
    }
  }

  /**
   * Get OAuth statistics
   */
  async getOAuthStats(): Promise<{
    google: { users: number; domains: string[] };
    microsoft: { users: number; tenants: string[] };
  }> {
    try {
      const [googleUsers, microsoftUsers] = await Promise.all([
        prisma.user.findMany({
          where: { oauth_provider: 'google', active: true },
          select: { domain: true },
        }),
        prisma.user.findMany({
          where: { oauth_provider: 'microsoft', active: true },
          select: { domain: true },
        }),
      ]);

      const googleDomains = [...new Set(googleUsers.map(u => u.domain).filter(Boolean))];
      const microsoftTenants = [...new Set(microsoftUsers.map(u => u.domain).filter(Boolean))];

      return {
        google: {
          users: googleUsers.length,
          domains: googleDomains,
        },
        microsoft: {
          users: microsoftUsers.length,
          tenants: microsoftTenants,
        },
      };
    } catch (error) {
      logger.error('Failed to get OAuth stats:', error);
      return {
        google: { users: 0, domains: [] },
        microsoft: { users: 0, tenants: [] },
      };
    }
  }

  /**
   * Get user role permissions
   */
  getUserPermissions(role: 'admin' | 'manager' | 'user'): string[] {
    const permissions: Record<string, string[]> = {
      admin: [
        'users:read',
        'users:create',
        'users:update',
        'users:delete',
        'shops:read',
        'shops:create',
        'shops:update',
        'shops:delete',
        'products:read',
        'products:create',
        'products:update',
        'products:delete',
        'products:export',
        'products:import',
        'categories:read',
        'categories:create',
        'categories:update',
        'categories:delete',
        'images:read',
        'images:upload',
        'images:delete',
        'sync:read',
        'sync:execute',
        'reports:read',
        'reports:export',
        'settings:read',
        'settings:update',
        'integrations:read',
        'integrations:create',
        'integrations:update',
        'integrations:delete',
      ],
      manager: [
        'products:read',
        'products:create',
        'products:update',
        'products:delete',
        'products:export',
        'products:import',
        'categories:read',
        'categories:create',
        'categories:update',
        'categories:delete',
        'images:read',
        'images:upload',
        'images:delete',
        'sync:read',
        'sync:execute',
        'reports:read',
        'reports:export',
        'shops:read',
      ],
      user: [
        'products:read',
        'categories:read',
        'images:read',
        'reports:read',
        'shops:read',
      ],
    };

    return permissions[role] || permissions.user;
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: User, permission: string): boolean {
    const userPermissions = this.getUserPermissions(user.role);
    return userPermissions.includes(permission);
  }

  /**
   * Sanitize user data (remove sensitive fields)
   */
  private sanitizeUser(user: any): User {
    if (!user) return user;
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser as User;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    byProvider: Record<string, number>;
  }> {
    try {
      const [total, active, inactive, byRole, byProvider] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { active: true } }),
        prisma.user.count({ where: { active: false } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true },
        }),
        prisma.user.groupBy({
          by: ['oauth_provider'],
          _count: { oauth_provider: true },
          where: { oauth_provider: { not: null } },
        }),
      ]);

      const roleStats = byRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>);

      const providerStats = byProvider.reduce((acc, item) => {
        acc[item.oauth_provider || 'local'] = item._count.oauth_provider;
        return acc;
      }, {} as Record<string, number>);

      return {
        total,
        active,
        inactive,
        byRole: roleStats,
        byProvider: providerStats,
      };
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      throw error;
    }
  }
}