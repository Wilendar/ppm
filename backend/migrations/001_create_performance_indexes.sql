-- Performance-critical indexes per design.md Section 2.3.2
-- PPM (PrestaShop Product Manager) Database Schema Enhancement
-- Author: Kamil Wiliński
-- Version: 2.0

-- Apply after initial Prisma migration

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Product Shop Data indexes  
CREATE INDEX IF NOT EXISTS idx_product_shop_data_product_shop ON product_shop_data(product_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_product_shop_data_sync_status ON product_shop_data(sync_status);

-- Sync History indexes
CREATE INDEX IF NOT EXISTS idx_sync_history_shop_product ON sync_history(shop_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_performed_at ON sync_history(performed_at DESC);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_shop_parent ON categories(shop_id, parent_id);

-- Images indexes
CREATE INDEX IF NOT EXISTS idx_images_product_position ON images(product_id, position);

-- Additional performance indexes for production
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status_type ON jobs(status, type);
CREATE INDEX IF NOT EXISTS idx_jobs_started_by ON jobs(started_by);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_categories_active_shop ON categories(shop_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_active_status ON products(id) WHERE status = 'ACTIVE';

COMMENT ON INDEX idx_products_sku IS 'Fast product lookup by SKU';
COMMENT ON INDEX idx_product_shop_data_sync_status IS 'Sync status monitoring';
COMMENT ON INDEX idx_sync_history_performed_at IS 'Chronological sync history';