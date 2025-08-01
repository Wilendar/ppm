# Technical Design Specification - PPM (Prestashop Product Manager)

## 1. System Architecture Overview

### 1.1 High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React.js      │    │   Node.js        │    │  PostgreSQL     │
│   Frontend      │◄──►│   Backend API    │◄──►│  Primary DB     │
│   (TypeScript)  │    │   (Express.js)   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        ▼                       │
         │              ┌──────────────────┐              │
         │              │     Redis        │              │
         │              │  Cache/Sessions  │              │
         │              └──────────────────┘              │
         │                        │                       │
         │                        ▼                       │
         │              ┌──────────────────┐              │
         └──────────────│   Load Balancer  │              │
                        │     (Nginx)      │              │
                        └──────────────────┘              │
                                 │                        │
                    ┌────────────┼────────────┐           │
                    ▼            ▼            ▼           ▼
          ┌─────────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────┐
          │PrestaShop   │ │PrestaShop   │ │ Subiekt  │ │Microsoft │
          │   Shop 1    │ │   Shop N    │ │    GT    │ │Dynamics  │
          │ (MySQL API) │ │ (MySQL API) │ │   (DB)   │ │   (API)  │
          └─────────────┘ └─────────────┘ └──────────┘ └──────────┘
```

### 1.2 Architecture Principles
- **Microservices-Ready**: Modular design allowing future service separation
- **API-First**: All functionality exposed through well-documented REST APIs
- **Security by Design**: Defense in depth with multiple security layers
- **Performance-Optimized**: Caching, connection pooling, and async processing
- **Scalable**: Horizontal scaling support with stateless design

## 2. Backend Architecture

### 2.1 Technology Stack
```typescript
// Core Technologies
- Runtime: Node.js 20+ LTS
- Framework: Express.js 4.18+
- Language: TypeScript 5.0+
- Primary Database: PostgreSQL 14+
- Compatibility Database: MySQL 8.0+
- Cache/Sessions: Redis 7.0+
- Process Manager: PM2
- Container: Docker with multi-stage builds
```

### 2.2 Folder Structure
```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── products.controller.ts
│   │   ├── shops.controller.ts
│   │   └── sync.controller.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rateLimiting.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/              # Database models
│   │   ├── User.model.ts
│   │   ├── Shop.model.ts
│   │   ├── Product.model.ts
│   │   └── SyncHistory.model.ts
│   ├── services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── prestashop.service.ts
│   │   ├── sync.service.ts
│   │   └── erp.service.ts
│   ├── utils/               # Utility functions
│   │   ├── encryption.util.ts
│   │   ├── validation.util.ts
│   │   └── logger.util.ts
│   ├── config/              # Configuration
│   │   ├── database.config.ts
│   │   ├── oauth.config.ts
│   │   └── app.config.ts
│   ├── routes/              # API routes
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── products.routes.ts
│   │   │   │   ├── shops.routes.ts
│   │   │   │   └── sync.routes.ts
│   │   └── index.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── api.types.ts
│   │   ├── prestashop.types.ts
│   │   └── erp.types.ts
│   └── app.ts              # Application entry point
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── migrations/              # Database migrations
├── seeds/                   # Database seeds
├── docs/                    # API documentation
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

### 2.3 Database Design

#### 2.3.1 Core Tables Schema
```sql
-- Users and Authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL, -- 'admin', 'manager', 'user'
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- PrestaShop Shop Connections
CREATE TABLE shops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    prestashop_version VARCHAR(10) NOT NULL,
    status shop_status DEFAULT 'active', -- 'active', 'inactive', 'error'
    last_sync_at TIMESTAMPTZ,
    created_by INTEGER REFERENCES users(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Central Product Catalog
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(255) UNIQUE NOT NULL,
    base_name VARCHAR(255) NOT NULL,
    base_description TEXT,
    status product_status DEFAULT 'draft', -- 'draft', 'active', 'archived'
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop-Specific Product Data
CREATE TABLE product_shop_data (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255),
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    status product_shop_status DEFAULT 'inactive',
    prestashop_id INTEGER,
    last_synced_at TIMESTAMPTZ,
    sync_status sync_status DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, shop_id)
);

-- Categories per Shop
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES categories(id),
    prestashop_id INTEGER,
    level INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product-Category Relationships per Shop
CREATE TABLE product_categories (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, category_id, shop_id)
);

-- Image Management
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    alt_text VARCHAR(255),
    position INTEGER DEFAULT 0,
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop-Specific Image Data
CREATE TABLE image_shop_data (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    alt_text VARCHAR(255),
    position INTEGER DEFAULT 0,
    prestashop_id INTEGER,
    sync_status sync_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(image_id, shop_id)
);

-- Synchronization History
CREATE TABLE sync_history (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(id),
    product_id INTEGER REFERENCES products(id),
    action sync_action NOT NULL, -- 'create', 'update', 'delete', 'sync'
    status sync_result NOT NULL, -- 'success', 'error', 'pending'
    error_message TEXT,
    data_snapshot JSONB,
    performed_by INTEGER REFERENCES users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import/Export Jobs
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    type job_type NOT NULL, -- 'import', 'export', 'sync'
    status job_status NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    config JSONB NOT NULL,
    results JSONB,
    started_by INTEGER REFERENCES users(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.3.2 Indexing Strategy
```sql
-- Performance-critical indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_product_shop_data_product_shop ON product_shop_data(product_id, shop_id);
CREATE INDEX idx_product_shop_data_sync_status ON product_shop_data(sync_status);
CREATE INDEX idx_sync_history_shop_product ON sync_history(shop_id, product_id);
CREATE INDEX idx_sync_history_performed_at ON sync_history(performed_at DESC);
CREATE INDEX idx_categories_shop_parent ON categories(shop_id, parent_id);
CREATE INDEX idx_images_product_position ON images(product_id, position);
```

### 2.4 API Design

#### 2.4.1 RESTful API Structure
```typescript
// API Base URL: /api/v1

// Authentication Endpoints
POST   /api/v1/auth/login           // OAuth login
POST   /api/v1/auth/refresh         // Token refresh
POST   /api/v1/auth/logout          // Logout
GET    /api/v1/auth/me              // Current user info

// User Management (Admin only)
GET    /api/v1/users                // List users
POST   /api/v1/users                // Create user
PUT    /api/v1/users/:id            // Update user
DELETE /api/v1/users/:id            // Delete user

// Shop Management
GET    /api/v1/shops                // List shops
POST   /api/v1/shops                // Add shop
PUT    /api/v1/shops/:id            // Update shop
DELETE /api/v1/shops/:id            // Remove shop
POST   /api/v1/shops/:id/test       // Test connection
GET    /api/v1/shops/:id/categories // Get shop categories

// Product Management
GET    /api/v1/products             // List products (with filters)
POST   /api/v1/products             // Create product
GET    /api/v1/products/:id         // Get product details
PUT    /api/v1/products/:id         // Update product
DELETE /api/v1/products/:id         // Delete product
POST   /api/v1/products/bulk        // Bulk operations

// Product-Shop Data
GET    /api/v1/products/:id/shops/:shopId    // Get shop-specific data
PUT    /api/v1/products/:id/shops/:shopId    // Update shop-specific data
POST   /api/v1/products/:id/shops/:shopId/sync  // Sync to shop

// Image Management
POST   /api/v1/products/:id/images     // Upload images
GET    /api/v1/products/:id/images     // List product images
PUT    /api/v1/images/:id              // Update image metadata
DELETE /api/v1/images/:id              // Delete image

// Synchronization
POST   /api/v1/sync/products/:id      // Sync specific product
POST   /api/v1/sync/shops/:id         // Sync entire shop
GET    /api/v1/sync/history           // Sync history
GET    /api/v1/sync/status            // Current sync status

// Import/Export
POST   /api/v1/import/csv             // Import from CSV
GET    /api/v1/export/products        // Export products
GET    /api/v1/jobs/:id               // Job status
DELETE /api/v1/jobs/:id               // Cancel job
```

#### 2.4.2 API Response Format
```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    version: string;
  };
}

// Error Response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

// Pagination
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### 2.5 Service Layer Architecture

#### 2.5.1 PrestaShop Service
```typescript
interface PrestaShopService {
  // Connection Management
  testConnection(shopId: number): Promise<boolean>;
  getShopInfo(shopId: number): Promise<ShopInfo>;
  
  // Product Operations
  createProduct(shopId: number, productData: ProductData): Promise<number>;
  updateProduct(shopId: number, productId: number, data: ProductData): Promise<void>;
  deleteProduct(shopId: number, productId: number): Promise<void>;
  getProduct(shopId: number, productId: number): Promise<ProductData>;
  
  // Category Operations
  getCategories(shopId: number): Promise<Category[]>;
  createCategory(shopId: number, categoryData: CategoryData): Promise<number>;
  
  // Image Operations
  uploadImage(shopId: number, productId: number, imageFile: Buffer): Promise<string>;
  deleteImage(shopId: number, imageId: number): Promise<void>;
  
  // Bulk Operations
  bulkCreateProducts(shopId: number, products: ProductData[]): Promise<BulkResult>;
  bulkUpdateProducts(shopId: number, updates: ProductUpdate[]): Promise<BulkResult>;
}
```

#### 2.5.2 Synchronization Service
```typescript
interface SyncService {
  // Product Synchronization
  syncProduct(productId: number, shopId: number): Promise<SyncResult>;
  bulkSyncProducts(productIds: number[], shopId: number): Promise<BulkSyncResult>;
  
  // Conflict Resolution
  detectConflicts(productId: number, shopId: number): Promise<ConflictInfo[]>;
  resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void>;
  
  // Sync Status
  getSyncStatus(productId: number, shopId?: number): Promise<SyncStatus>;
  getSyncHistory(filters: SyncHistoryFilters): Promise<SyncHistoryEntry[]>;
}
```

## 3. Frontend Architecture

### 3.1 Technology Stack
```typescript
// Core Technologies
- Framework: React 18+ with TypeScript
- Build Tool: Vite 4+
- State Management: Redux Toolkit + RTK Query
- UI Framework: Material-UI v5 or Ant Design v5
- Styling: Styled-components or Emotion
- Routing: React Router v6
- Form Handling: React Hook Form + Yup validation
- Charts: Recharts or Chart.js
- Date Handling: date-fns
- HTTP Client: Axios (via RTK Query)
```

### 3.2 Folder Structure
```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   ├── DataTable/
│   │   │   └── ImageUploader/
│   │   ├── forms/
│   │   │   ├── ProductForm/
│   │   │   ├── ShopForm/
│   │   │   └── CategoryForm/
│   │   └── layout/
│   │       ├── Header/
│   │       ├── Sidebar/
│   │       └── Footer/
│   ├── pages/               # Page components
│   │   ├── Dashboard/
│   │   ├── Products/
│   │   ├── Shops/
│   │   ├── Sync/
│   │   └── Settings/
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts
│   │   ├── useShops.ts
│   │   └── useSync.ts
│   ├── store/               # Redux store
│   │   ├── api/
│   │   │   ├── authApi.ts
│   │   │   ├── productsApi.ts
│   │   │   ├── shopsApi.ts
│   │   │   └── syncApi.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── uiSlice.ts
│   │   │   └── settingsSlice.ts
│   │   └── index.ts
│   ├── types/               # TypeScript types
│   │   ├── api.types.ts
│   │   ├── product.types.ts
│   │   ├── shop.types.ts
│   │   └── user.types.ts
│   ├── utils/               # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── styles/              # Global styles
│   │   ├── theme.ts
│   │   ├── globals.css
│   │   └── variables.css
│   ├── services/            # API services
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
├── tests/
├── docs/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── Dockerfile
```

### 3.3 State Management Architecture
```typescript
// Redux Store Structure
interface RootState {
  auth: AuthState;
  ui: UIState;
  settings: SettingsState;
  api: ApiState; // RTK Query
}

// Auth State
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// UI State
interface UIState {
  theme: 'light' | 'dark';
  sidebar: {
    isOpen: boolean;
    collapsed: boolean;
  };
  modals: {
    [key: string]: boolean;
  };
  notifications: Notification[];
}

// RTK Query API Slices
const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/products',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Product', 'ProductShopData'],
  endpoints: (builder) => ({
    getProducts: builder.query<ProductsResponse, ProductsQuery>({
      query: (params) => ({ url: '', params }),
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (data) => ({ url: '', method: 'POST', body: data }),
      invalidatesTags: ['Product'],
    }),
    // ... more endpoints
  }),
});
```

### 3.4 Component Architecture

#### 3.4.1 Component Design Principles
- **Composition over Inheritance**: Favor component composition
- **Single Responsibility**: Each component has one clear purpose
- **Prop Drilling Avoidance**: Use context or Redux for deep state
- **Performance Optimization**: Memo, useMemo, useCallback where needed
- **Accessibility First**: WCAG 2.1 compliance built-in

#### 3.4.2 Key Component Patterns
```typescript
// Product Management Component Example
interface ProductListProps {
  shopId?: number;
  categoryId?: number;
  searchQuery?: string;
}

const ProductList: React.FC<ProductListProps> = ({ 
  shopId, 
  categoryId, 
  searchQuery 
}) => {
  const {
    data: products,
    isLoading,
    error,
    refetch
  } = useGetProductsQuery({
    shopId,
    categoryId,
    search: searchQuery,
    page: 1,
    limit: 50
  });

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  
  const handleBulkSync = useCallback(async () => {
    // Bulk sync logic
  }, [selectedProducts]);

  if (isLoading) return <ProductListSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <div className="product-list">
      <ProductListHeader 
        selectedCount={selectedProducts.length}
        onBulkSync={handleBulkSync}
        onExport={() => {/* export logic */}}
      />
      <ProductTable
        products={products?.data || []}
        selectedIds={selectedProducts}
        onSelectionChange={setSelectedProducts}
        onProductEdit={(id) => navigate(`/products/${id}/edit`)}
      />
      <Pagination 
        current={products?.meta?.page || 1}
        total={products?.meta?.total || 0}
        pageSize={50}
        onChange={(page) => {/* pagination logic */}}
      />
    </div>
  );
};
```

## 4. Integration Architecture

### 4.1 PrestaShop API Integration
```typescript
class PrestaShopAPIClient {
  private baseURL: string;
  private apiKey: string;
  private version: '8' | '9';
  private rateLimiter: RateLimiter;

  constructor(config: PSConfig) {
    this.baseURL = config.url;
    this.apiKey = config.apiKey;
    this.version = config.version;
    this.rateLimiter = new RateLimiter(config.rateLimit);
  }

  async makeRequest<T>(
    method: HttpMethod,
    resource: string,
    data?: any
  ): Promise<T> {
    await this.rateLimiter.acquire();
    
    try {
      const response = await axios({
        method,
        url: `${this.baseURL}/api/${resource}`,
        headers: {
          'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        data,
        timeout: 30000
      });

      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Version-specific adaptations
  private adaptProductData(product: ProductData): any {
    if (this.version === '8') {
      return this.adaptForV8(product);
    }
    return this.adaptForV9(product);
  }
}
```

### 4.2 OAuth Integration
```typescript
// Google OAuth Configuration
const googleOAuthConfig: OAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.BASE_URL}/auth/google/callback`,
  scope: ['openid', 'email', 'profile'],
  domainRestriction: process.env.GOOGLE_DOMAIN_RESTRICTION
};

// Microsoft OAuth Configuration
const microsoftOAuthConfig: OAuthConfig = {
  clientId: process.env.MICROSOFT_CLIENT_ID!,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  redirectUri: `${process.env.BASE_URL}/auth/microsoft/callback`,
  scope: ['openid', 'email', 'profile'],
  tenant: process.env.MICROSOFT_TENANT
};

class OAuthService {
  async handleGoogleCallback(code: string): Promise<AuthResult> {
    const tokenResponse = await this.exchangeCodeForTokens(
      'google',
      code,
      googleOAuthConfig
    );
    
    const userInfo = await this.getUserInfo('google', tokenResponse.access_token);
    
    // Domain restriction check
    if (googleOAuthConfig.domainRestriction) {
      if (!userInfo.email.endsWith(`@${googleOAuthConfig.domainRestriction}`)) {
        throw new Error('Domain not allowed');
      }
    }
    
    return this.createOrUpdateUser(userInfo, 'google');
  }
}
```

## 5. Performance Architecture

### 5.1 Caching Strategy
```typescript
// Multi-Level Caching Architecture
interface CacheLayer {
  level: 'memory' | 'redis' | 'database';
  ttl: number;
  invalidation: 'time' | 'event' | 'manual';
}

const cachingStrategy: Record<string, CacheLayer[]> = {
  'shop-categories': [
    { level: 'memory', ttl: 300, invalidation: 'time' },
    { level: 'redis', ttl: 3600, invalidation: 'event' }
  ],
  'product-details': [
    { level: 'memory', ttl: 60, invalidation: 'event' },
    { level: 'redis', ttl: 1800, invalidation: 'event' }
  ],
  'sync-status': [
    { level: 'memory', ttl: 30, invalidation: 'time' }
  ]
};

class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private redisClient: Redis;

  async get<T>(key: string, type: string): Promise<T | null> {
    const strategy = cachingStrategy[type];
    
    // Try memory cache first
    if (strategy.some(s => s.level === 'memory')) {
      const memoryResult = this.memoryCache.get(key);
      if (memoryResult && !this.isExpired(memoryResult)) {
        return memoryResult.data;
      }
    }
    
    // Try Redis cache
    if (strategy.some(s => s.level === 'redis')) {
      const redisResult = await this.redisClient.get(key);
      if (redisResult) {
        const data = JSON.parse(redisResult);
        // Populate memory cache
        this.setMemoryCache(key, data, strategy);
        return data;
      }
    }
    
    return null;
  }
}
```

### 5.2 Database Optimization
```typescript
// Connection Pooling Configuration
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Pool settings
  min: 5,
  max: 20,
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 60000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
};

// Query Optimization Examples
class ProductRepository {
  // Optimized product search with pagination
  async findProducts(filters: ProductFilters): Promise<PaginatedResult<Product>> {
    const query = this.db('products as p')
      .select([
        'p.*',
        this.db.raw('COUNT(psd.shop_id) as shop_count'),
        this.db.raw('AVG(psd.price) as avg_price')
      ])
      .leftJoin('product_shop_data as psd', 'p.id', 'psd.product_id')
      .groupBy('p.id');

    // Apply filters with indexes
    if (filters.search) {
      query.where(function() {
        this.where('p.base_name', 'ilike', `%${filters.search}%`)
            .orWhere('p.sku', 'ilike', `%${filters.search}%`);
      });
    }

    if (filters.status) {
      query.where('p.status', filters.status);
    }

    // Pagination with offset optimization for large datasets
    const total = await query.clone().count('* as count').first();
    const results = await query
      .offset((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .orderBy('p.updated_at', 'desc');

    return {
      data: results,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total: parseInt(total.count as string),
        totalPages: Math.ceil(parseInt(total.count as string) / filters.limit)
      }
    };
  }
}
```

## 6. Security Architecture

### 6.1 Authentication & Authorization
```typescript
// JWT Token Management
interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

class AuthManager {
  private jwtSecret: string;
  private refreshSecret: string;

  generateTokenPair(user: User): TokenPair {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.refreshSecret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async validateToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}

// Role-Based Access Control
const permissions: Record<UserRole, Permission[]> = {
  admin: [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'shops:create', 'shops:read', 'shops:update', 'shops:delete',
    'products:create', 'products:read', 'products:update', 'products:delete',
    'sync:execute', 'settings:manage'
  ],
  manager: [
    'products:create', 'products:read', 'products:update', 'products:delete',
    'shops:read', 'sync:execute', 'import:execute', 'export:execute'
  ],
  user: [
    'products:read', 'shops:read'
  ]
};

function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userPermissions = permissions[req.user.role];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action'
        }
      });
    }
    
    next();
  };
}
```

### 6.2 Data Encryption
```typescript
class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  }

  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('PPM-AUTH-DATA', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('PPM-AUTH-DATA', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## 7. Monitoring & Observability

### 7.1 Application Monitoring
```typescript
// Performance Monitoring
class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>();

  startTimer(operation: string): () => void {
    const start = process.hrtime.bigint();
    
    return () => {
      const duration = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
      this.recordMetric(operation, duration);
    };
  }

  recordMetric(operation: string, duration: number): void {
    const metric = this.metrics.get(operation) || {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      avgDuration: 0
    };

    metric.count++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.avgDuration = metric.totalDuration / metric.count;

    this.metrics.set(operation, metric);
  }

  getMetrics(): Record<string, PerformanceMetric> {
    return Object.fromEntries(this.metrics);
  }
}

// Health Check Endpoints
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    uptime: process.uptime(),
    checks: {
      database: 'healthy',
      redis: 'healthy',
      prestashop_apis: 'healthy'
    }
  };

  res.json(health);
});
```

### 7.2 Logging Strategy
```typescript
// Structured Logging
interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  service: string;
  userId?: number;
  shopId?: number;
  productId?: number;
  requestId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private winston: winston.Logger;

  constructor() {
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'ppm-api' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  logOperation(operation: string, context: LogContext, metadata?: any): void {
    this.winston.info('Operation executed', {
      operation,
      userId: context.userId,
      shopId: context.shopId,
      productId: context.productId,
      requestId: context.requestId,
      metadata
    });
  }

  logError(error: Error, context: LogContext): void {
    this.winston.error('Error occurred', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      userId: context.userId,
      shopId: context.shopId,
      requestId: context.requestId
    });
  }
}
```

This technical design specification provides a comprehensive foundation for implementing the PPM system with enterprise-grade architecture, security, and performance considerations.