// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Product Types (matching backend)
export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  status: ProductStatus;
  version: number;
  created_at: string;
  updated_at: string;
  shopData?: ProductShopData[];
  images?: ProductImage[];
}

export interface ProductShopData {
  id: number;
  product_id: number;
  shop_id: number;
  name: string;
  description?: string;
  short_description?: string;
  price: number;
  status: ProductStatus;
  category_id?: number;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  shop?: Shop;
}

export interface ProductImage {
  id: number;
  product_id: number;
  filename: string;
  alt_text?: string;
  is_main: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: number;
  name: string;
  shortName: string; // max 8 characters for badges
  api_url: string;
  prestashop_version: string;
  status: ShopStatus;
  created_at: string;
  updated_at: string;
}

// Enums (matching backend)
export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export enum ShopStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE'
}

// Form Types
export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  status?: ProductStatus;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  status?: ProductStatus;
}

export interface ProductFilters {
  search?: string;
  status?: ProductStatus;
  category?: string;
  shop_id?: number;
  created_after?: string;
  created_before?: string;
}

export interface ProductListParams extends ProductFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Statistics Types
export interface ProductStats {
  total: number;
  by_status: Record<ProductStatus, number>;
  recent_count: number;
  shops_count: number;
}

// User Types (for future authentication)
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  provider: OAuthProvider;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER'
}

export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT'
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Enhanced Product Types for UI
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: VariantAttribute[];
  thumbnail?: string;
}

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface ShopAssignment {
  shopId: string;
  shopName: string;
  shortName: string; // max 8 chars
  isActive: boolean;
  lastSync?: Date;
  syncStatus?: 'synced' | 'differences' | 'error' | 'syncing' | 'inactive';
  differences?: string[];
}

export interface CategoryPath {
  path: CategoryNode[];
  breadcrumb: string; // "Main > Sub1 > Sub2"
}

export interface CategoryNode {
  id: string;
  name: string;
  level: number;
}

export interface SyncStatus {
  status: 'synced' | 'differences' | 'not_synced' | 'syncing' | 'error';
  differences?: string[];
  lastSync?: Date;
  nextSync?: Date;
}

export interface EnhancedProduct extends Product {
  thumbnail?: string;
  variants: ProductVariant[];
  shops: ShopAssignment[];
  categories: CategoryPath[];
  syncStatus: SyncStatus;
  lastSyncAt?: Date;
}

// Detailed Product Types for PrestaShop-like View
export interface DetailedProductImage extends ProductImage {
  url: string;
  thumbnail_url: string;
  file_size: number;
  mime_type: string;
}

export interface CategorySelection {
  level: number;
  categoryId: string;
  categoryName: string;
  path: CategoryNode[];
  breadcrumb: string;
  children?: CategorySelection[];
}

export interface ShopPricing {
  price: number;
  sale_price?: number;
  currency: string;
  tax_rate: number;
  price_with_tax: number;
}

export interface ShopInventory {
  stock_quantity: number;
  low_stock_threshold: number;
  track_quantity: boolean;
  allow_backorders: boolean;
}

export interface ShopCustomizations {
  custom_name?: string;
  custom_description?: string;
  custom_tags?: string[];
  custom_meta_title?: string;
  custom_meta_description?: string;
}

export interface SyncDetails {
  sync_id: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
  changes_detected: string[];
  error_message?: string;
}

export interface DetailedShopData extends ProductShopData {
  pricing: ShopPricing;
  inventory: ShopInventory;
  customizations: ShopCustomizations;
  lastSyncDetails: SyncDetails;
}

export interface ActivityEntry {
  id: string;
  timestamp: Date;
  action: 'created' | 'updated' | 'synced' | 'error' | 'exported';
  description: string;
  actor?: string;
  details?: any;
}

export interface DetailedSyncStatus extends SyncStatus {
  syncedShops: number;
  totalShops: number;
  lastSyncDuration?: number;
  averageSyncTime?: number;
  syncErrors: string[];
}

export interface ProductMetadata {
  creator: string;
  last_editor?: string;
  total_views: number;
  export_count: number;
  size_estimate: string; // "2.5 MB"
}

export interface DetailedVariant extends ProductVariant {
  status: ProductStatus;
  images: string[];
  shopSpecificData: {
    shopId: string;
    price?: number;
    stock?: number;
    isActive: boolean;
  }[];
}

export interface ProductFeature {
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'list';
  category?: string;
}

export interface DetailedProduct extends EnhancedProduct {
  images: DetailedProductImage[];
  categories: CategorySelection[];
  descriptions: {
    short: string;
    long: string;
    features: ProductFeature[];
  };
  variants: DetailedVariant[];
  shopData: DetailedShopData[];
  timeline: ActivityEntry[];
  syncStatus: DetailedSyncStatus;
  metadata: ProductMetadata;
}

// Query Keys for React Query
export const QUERY_KEYS = {
  products: ['products'] as const,
  product: (id: number) => ['products', id] as const,
  productStats: ['products', 'stats'] as const,
  shops: ['shops'] as const,
  shop: (id: number) => ['shops', id] as const,
  user: ['user'] as const,
} as const;