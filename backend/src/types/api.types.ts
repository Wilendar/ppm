/**
 * API Response Types for PPM Backend
 * Defines common interfaces for API responses, pagination, and error handling
 */

// Generic API Response Interface
export interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    version: string;
    pagination?: PaginationMeta;
  };
}

// API Error Response Interface
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
    method?: string;
  };
}

// Pagination Metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated Response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    timestamp: string;
    version: string;
    pagination: PaginationMeta;
  };
}

// Query Parameters for Filtering
export interface BaseQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Filter Parameters for Products
export interface ProductQuery extends BaseQuery {
  shop_id?: number;
  category_id?: number;
  status?: 'draft' | 'active' | 'archived';
  created_by?: number;
  price_min?: number;
  price_max?: number;
  has_images?: boolean;
  sync_status?: 'pending' | 'synced' | 'error';
}

// User Role Types
export type UserRole = 'admin' | 'manager' | 'user';

// Permission Types
export type Permission = 
  | 'users:create' | 'users:read' | 'users:update' | 'users:delete'
  | 'shops:create' | 'shops:read' | 'shops:update' | 'shops:delete'
  | 'products:create' | 'products:read' | 'products:update' | 'products:delete'
  | 'sync:execute' | 'import:execute' | 'export:execute'
  | 'settings:manage';

// Job Status Types
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// Job Types
export type JobType = 'import' | 'export' | 'sync' | 'bulk_operation';

// Sync Status Types
export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Shop Status Types
export type ShopStatus = 'active' | 'inactive' | 'error';

// Product Status Types
export type ProductStatus = 'draft' | 'active' | 'archived';

// Product Shop Status Types
export type ProductShopStatus = 'inactive' | 'active' | 'out_of_stock';

// Sync Action Types
export type SyncAction = 'create' | 'update' | 'delete' | 'sync' | 'export' | 'import';

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request Context for Logging
export interface RequestContext {
  requestId: string;
  userId?: number;
  userRole?: UserRole;
  ip?: string;
  userAgent?: string;
  method: string;
  path: string;
  timestamp: string;
}

// Validation Error Interface
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Bulk Operation Types
export interface BulkOperation {
  operation: 'create' | 'update' | 'delete' | 'export';
  items: any[];
  options?: {
    shop_ids?: number[];
    force?: boolean;
    dry_run?: boolean;
  };
}

// Bulk Operation Result
export interface BulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    item: any;
    error: string;
  }>;
  results: any[];
}

// Health Check Response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    external_apis: 'healthy' | 'unhealthy';
  };
  metrics?: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

// File Upload Response
export interface FileUploadResponse {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
  url: string;
}

// Authentication Response
export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// Refresh Token Response
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Generic Success Response
export interface SuccessResponse {
  success: true;
  message: string;
  timestamp: string;
}

// Export for Express Request with User
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
    name: string;
  };
  requestId?: string;
}