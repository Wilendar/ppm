/**
 * PrestaShop API Types for PPM Backend
 * Defines interfaces for PrestaShop API integration and data structures
 */

// PrestaShop Configuration
export interface PrestaShopConfig {
  url: string;
  apiKey: string;
  version: '8' | '9';
  timeout?: number;
  rateLimit?: {
    max: number;
    windowMs: number;
  };
}

// PrestaShop API Response Wrapper
export interface PrestaShopApiResponse<T = any> {
  [key: string]: T;
}

// PrestaShop Product Structure
export interface PrestaShopProduct {
  id?: number;
  id_manufacturer?: number;
  id_supplier?: number;
  id_category_default?: number;
  new?: boolean;
  cache_default_attribute?: number;
  id_default_image?: number;
  id_default_combination?: number;
  id_tax_rules_group?: number;
  position_in_category?: number;
  manufacturer_name?: string;
  quantity?: number;
  type?: 'simple' | 'pack' | 'virtual';
  id_shop_default?: number;
  reference?: string;
  supplier_reference?: string;
  location?: string;
  width?: number;
  height?: number;
  depth?: number;
  weight?: number;
  quantity_discount?: boolean;
  ean13?: string;
  isbn?: string;
  upc?: string;
  mpn?: string;
  cache_is_pack?: boolean;
  cache_has_attachments?: boolean;
  is_virtual?: boolean;
  state?: number;
  additional_delivery_times?: number;
  delivery_in_stock?: MultiLangField;
  delivery_out_stock?: MultiLangField;
  product_type?: string;
  on_sale?: boolean;
  online_only?: boolean;
  ecotax?: number;
  minimal_quantity?: number;
  low_stock_threshold?: number;
  low_stock_alert?: boolean;
  price?: number;
  wholesale_price?: number;
  unity?: string;
  unit_price?: number;
  unit_price_ratio?: number;
  additional_shipping_cost?: number;
  customizable?: number;
  text_fields?: number;
  uploadable_files?: number;
  active?: boolean;
  redirect_type?: string;
  id_type_redirected?: number;
  available_for_order?: boolean;
  available_date?: string;
  show_condition?: boolean;
  condition?: 'new' | 'used' | 'refurbished';
  show_price?: boolean;
  indexed?: boolean;
  visibility?: 'both' | 'catalog' | 'search' | 'none';
  advanced_stock_management?: boolean;
  date_add?: string;
  date_upd?: string;
  pack_stock_type?: number;
  
  // Multi-language fields
  meta_description?: MultiLangField;
  meta_keywords?: MultiLangField;
  meta_title?: MultiLangField;
  link_rewrite?: MultiLangField;
  name?: MultiLangField;
  description?: MultiLangField;
  description_short?: MultiLangField;
  available_now?: MultiLangField;
  available_later?: MultiLangField;
  
  // Associations
  associations?: {
    categories?: Array<{ id: number }>;
    images?: Array<{ id: number }>;
    combinations?: Array<{ id: number }>;
    product_option_values?: Array<{ id: number }>;
    product_features?: Array<{ id: number; id_feature_value: number }>;
    tags?: Array<{ id: number }>;
    stock_availables?: Array<{ id: number; id_product_attribute: number }>;
    accessories?: Array<{ id: number }>;
    product_bundle?: Array<{ id: number; quantity: number }>;
  };
}

// Multi-language field structure
export interface MultiLangField {
  [languageId: string]: string;
}

// PrestaShop Category Structure
export interface PrestaShopCategory {
  id?: number;
  id_parent?: number;
  level_depth?: number;
  nb_products_recursive?: number;
  active?: boolean;
  id_shop_default?: number;
  is_root_category?: boolean;
  position?: number;
  date_add?: string;
  date_upd?: string;
  
  // Multi-language fields
  name?: MultiLangField;
  link_rewrite?: MultiLangField;
  description?: MultiLangField;
  meta_title?: MultiLangField;
  meta_description?: MultiLangField;
  meta_keywords?: MultiLangField;
  
  // Associations
  associations?: {
    categories?: Array<{ id: number }>;
    products?: Array<{ id: number }>;
    images?: Array<{ id: number }>;
  };
}

// PrestaShop Image Structure
export interface PrestaShopImage {
  id?: number;
  id_product?: number;
  position?: number;
  cover?: boolean;
  legend?: MultiLangField;
  
  // Associations
  associations?: {
    product_option_values?: Array<{ id: number }>;
  };
}

// PrestaShop Stock Available Structure
export interface PrestaShopStockAvailable {
  id?: number;
  id_product?: number;
  id_product_attribute?: number;
  id_shop?: number;
  id_shop_group?: number;
  quantity?: number;
  depends_on_stock?: boolean;
  out_of_stock?: number;
  location?: string;
}

// PrestaShop Language Structure
export interface PrestaShopLanguage {
  id?: number;
  name?: string;
  iso_code?: string;
  locale?: string;
  language_code?: string;
  active?: boolean;
  is_rtl?: boolean;
  date_format_lite?: string;
  date_format_full?: string;
}

// PrestaShop Shop Information
export interface PrestaShopShopInfo {
  id?: number;
  name?: string;
  url?: string;
  ssl_domain?: string;
  ssl_domain_shop?: string;
  active?: boolean;
  deleted?: boolean;
  theme_name?: string;
  
  // Configuration
  languages?: PrestaShopLanguage[];
  currencies?: Array<{ id: number; name: string; iso_code: string; sign: string }>;
  groups?: Array<{ id: number; name: MultiLangField }>;
}

// PrestaShop API Error Response
export interface PrestaShopApiError {
  error: {
    code: number;
    message: string;
  };
}

// PrestaShop Product Creation/Update Data
export interface PrestaShopProductData {
  reference?: string;
  name: MultiLangField;
  description?: MultiLangField;
  description_short?: MultiLangField;
  price: number;
  wholesale_price?: number;
  active?: boolean;
  available_for_order?: boolean;
  show_price?: boolean;
  id_category_default?: number;
  categories?: number[];
  quantity?: number;
  minimal_quantity?: number;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  condition?: 'new' | 'used' | 'refurbished';
  visibility?: 'both' | 'catalog' | 'search' | 'none';
  meta_title?: MultiLangField;
  meta_description?: MultiLangField;
  meta_keywords?: MultiLangField;
  link_rewrite?: MultiLangField;
  features?: Array<{
    id_feature: number;
    id_feature_value: number;
  }>;
}

// PrestaShop Category Creation/Update Data
export interface PrestaShopCategoryData {
  id_parent: number;
  name: MultiLangField;
  description?: MultiLangField;
  link_rewrite: MultiLangField;
  active?: boolean;
  meta_title?: MultiLangField;
  meta_description?: MultiLangField;
  meta_keywords?: MultiLangField;
}

// PrestaShop Image Upload Data
export interface PrestaShopImageData {
  image: Buffer | string; // Base64 or file buffer
  legend?: MultiLangField;
  cover?: boolean;
}

// PrestaShop Bulk Operation Result
export interface PrestaShopBulkResult {
  successful: Array<{
    local_id?: number;
    prestashop_id: number;
    action: 'create' | 'update' | 'delete';
  }>;
  failed: Array<{
    local_id?: number;
    error: string;
    action: 'create' | 'update' | 'delete';
  }>;
}

// PrestaShop Sync Status
export interface PrestaShopSyncStatus {
  product_id: number;
  shop_id: number;
  prestashop_id?: number;
  last_synced?: string;
  sync_status: 'pending' | 'synced' | 'error';
  error_message?: string;
  local_hash?: string;
  remote_hash?: string;
  conflicts?: string[];
}

// PrestaShop Connection Test Result
export interface PrestaShopConnectionTest {
  success: boolean;
  version?: string;
  shop_info?: {
    name: string;
    url: string;
    languages: string[];
    currencies: string[];
  };
  error?: string;
  response_time?: number;
}

// PrestaShop Rate Limiting
export interface PrestaShopRateLimit {
  requests_made: number;
  requests_remaining: number;
  reset_time: number;
  window_ms: number;
}

// PrestaShop Webhook Event Types
export type PrestaShopWebhookEvent = 
  | 'product_created'
  | 'product_updated' 
  | 'product_deleted'
  | 'category_created'
  | 'category_updated'
  | 'category_deleted'
  | 'stock_updated';

// PrestaShop Webhook Payload
export interface PrestaShopWebhookPayload {
  event: PrestaShopWebhookEvent;
  shop_id: number;
  resource_id: number;
  resource_type: 'product' | 'category' | 'stock';
  timestamp: string;
  data?: any;
}