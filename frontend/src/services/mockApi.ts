import { 
  ApiResponse, 
  PaginatedResponse, 
  Product, 
  ProductStatus,
  ProductStats,
  ProductListParams,
  EnhancedProduct,
  ProductVariant,
  ShopAssignment,
  CategoryPath,
  SyncStatus
} from '../types/api.types';

// Enhanced Mock Products Data
const mockEnhancedProducts: EnhancedProduct[] = [
  {
    id: 1,
    sku: 'DEMO-001',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
    category: 'Electronics',
    status: ProductStatus.ACTIVE,
    version: 1,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-20T14:30:00Z',
    // Enhanced features
    thumbnail: 'https://via.placeholder.com/64x64/4CAF50/FFFFFF?text=HP',
    variants: [
      {
        id: 'var-1-1',
        name: 'Black Edition',
        sku: 'DEMO-001-BLK',
        price: 299.99,
        stock: 15,
        thumbnail: 'https://via.placeholder.com/48x48/000000/FFFFFF?text=BLK',
        attributes: [
          { name: 'Color', value: 'Black' },
          { name: 'Size', value: 'Standard' }
        ]
      },
      {
        id: 'var-1-2',
        name: 'White Edition',
        sku: 'DEMO-001-WHT',
        price: 319.99,
        stock: 8,
        thumbnail: 'https://via.placeholder.com/48x48/FFFFFF/000000?text=WHT',
        attributes: [
          { name: 'Color', value: 'White' },
          { name: 'Size', value: 'Standard' }
        ]
      },
      {
        id: 'var-1-3',
        name: 'Limited Gold',
        sku: 'DEMO-001-GLD',
        price: 399.99,
        stock: 5,
        thumbnail: 'https://via.placeholder.com/48x48/FFD700/000000?text=GLD',
        attributes: [
          { name: 'Color', value: 'Gold' },
          { name: 'Edition', value: 'Limited' }
        ]
      }
    ],
    shops: [
      {
        shopId: '1',
        shopName: 'EU Electronics Store',
        shortName: 'EU-ELEC',
        isActive: true,
        lastSync: new Date('2025-01-20T14:30:00Z'),
        syncStatus: 'synced'
      },
      {
        shopId: '2',
        shopName: 'US Premium Audio',
        shortName: 'US-AUDIO',
        isActive: true,
        lastSync: new Date('2025-01-20T14:25:00Z'),
        syncStatus: 'differences',
        differences: ['Price mismatch']
      },
      {
        shopId: '3',
        shopName: 'UK Tech Hub',
        shortName: 'UK-TECH',
        isActive: true,
        lastSync: new Date('2025-01-20T14:20:00Z'),
        syncStatus: 'synced'
      },
      {
        shopId: '7',
        shopName: 'DE Audio Shop',
        shortName: 'DE-AUDIO',
        isActive: true,
        lastSync: new Date('2025-01-19T10:00:00Z'),
        syncStatus: 'error',
        differences: ['Connection timeout']
      },
      {
        shopId: '8',
        shopName: 'FR Electronics',
        shortName: 'FR-ELEC',
        isActive: true,
        lastSync: new Date('2025-01-20T14:10:00Z'),
        syncStatus: 'syncing'
      },
      {
        shopId: '9',
        shopName: 'IT Premium Store',
        shortName: 'IT-PREM',
        isActive: false,
        lastSync: new Date('2025-01-19T10:00:00Z'),
        syncStatus: 'inactive'
      }
    ],
    categories: [
      {
        path: [
          { id: 'cat-1', name: 'Electronics', level: 1 },
          { id: 'cat-2', name: 'Audio & Video', level: 2 },
          { id: 'cat-3', name: 'Headphones', level: 3 }
        ],
        breadcrumb: 'Electronics > Consumer Electronics > Audio & Video > Headphones & Speakers > Professional Headphones'
      }
    ],
    syncStatus: {
      status: 'synced',
      lastSync: new Date('2025-01-20T14:30:00Z'),
      nextSync: new Date('2025-01-21T14:30:00Z')
    },
    lastSyncAt: new Date('2025-01-20T14:30:00Z'),
    shopData: [
      {
        id: 1,
        product_id: 1,
        shop_id: 1,
        name: 'Premium Wireless Headphones - EU Version',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 299.99,
        status: ProductStatus.ACTIVE,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-20T14:30:00Z',
        shop: { id: 1, name: 'EU Electronics Store', shortName: 'EU-ELEC', api_url: 'https://eu.example.com', prestashop_version: '8.1.0', status: 'ACTIVE' as any, created_at: '', updated_at: '' }
      },
      {
        id: 2,
        product_id: 1,
        shop_id: 2,
        name: 'Premium Wireless Headphones - US Version',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 329.99,
        status: ProductStatus.ACTIVE,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-20T14:30:00Z',
        shop: { id: 2, name: 'US Premium Audio', shortName: 'US-AUDIO', api_url: 'https://us.example.com', prestashop_version: '9.0.0', status: 'ACTIVE' as any, created_at: '', updated_at: '' }
      }
    ],
    images: [
      {
        id: 1,
        product_id: 1,
        filename: 'headphones_main.jpg',
        alt_text: 'Premium Wireless Headphones - Main View',
        is_main: true,
        sort_order: 1,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z'
      }
    ]
  },
  {
    id: 2,
    sku: 'DEMO-002',
    name: 'Smart Fitness Tracker',
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, and waterproof design.',
    category: 'Wearables',
    status: ProductStatus.ACTIVE,
    version: 2,
    created_at: '2025-01-10T09:00:00Z',
    updated_at: '2025-01-25T16:45:00Z',
    // Enhanced features
    thumbnail: 'https://via.placeholder.com/64x64/2196F3/FFFFFF?text=FT',
    variants: [
      {
        id: 'var-2-1',
        name: 'Standard Edition',
        sku: 'DEMO-002-STD',
        price: 199.99,
        stock: 25,
        thumbnail: 'https://via.placeholder.com/48x48/2196F3/FFFFFF?text=STD',
        attributes: [
          { name: 'Edition', value: 'Standard' },
          { name: 'Color', value: 'Black' }
        ]
      },
      {
        id: 'var-2-2',
        name: 'Pro Edition',
        sku: 'DEMO-002-PRO',
        price: 249.99,
        stock: 12,
        thumbnail: 'https://via.placeholder.com/48x48/C0C0C0/000000?text=PRO',
        attributes: [
          { name: 'Edition', value: 'Pro' },
          { name: 'Color', value: 'Silver' }
        ]
      }
    ],
    shops: [
      {
        shopId: '1',
        shopName: 'EU Electronics Store',
        shortName: 'EU-ELEC',
        isActive: true,
        lastSync: new Date('2025-01-25T16:45:00Z'),
        syncStatus: 'differences',
        differences: ['Stock level mismatch']
      },
      {
        shopId: '4',
        shopName: 'Fitness World',
        shortName: 'FITNESS',
        isActive: true,
        lastSync: new Date('2025-01-25T16:40:00Z'),
        syncStatus: 'synced'
      },
      {
        shopId: '10',
        shopName: 'Sport & Health',
        shortName: 'SPORT-HP',
        isActive: true,
        lastSync: new Date('2025-01-25T16:35:00Z'),
        syncStatus: 'synced'
      },
      {
        shopId: '11',
        shopName: 'Wellness Store',
        shortName: 'WELLNESS',
        isActive: true,
        lastSync: new Date('2025-01-25T16:30:00Z'),
        syncStatus: 'error',
        differences: ['API connection failed']
      }
    ],
    categories: [
      {
        path: [
          { id: 'cat-4', name: 'Wearables', level: 1 },
          { id: 'cat-5', name: 'Fitness Trackers', level: 2 }
        ],
        breadcrumb: 'Wearables > Fitness Trackers'
      }
    ],
    syncStatus: {
      status: 'differences',
      differences: ['Price mismatch in EU store', 'Stock level discrepancy'],
      lastSync: new Date('2025-01-25T16:45:00Z'),
      nextSync: new Date('2025-01-26T16:45:00Z')
    },
    lastSyncAt: new Date('2025-01-25T16:45:00Z'),
    shopData: [
      {
        id: 3,
        product_id: 2,
        shop_id: 1,
        name: 'Smart Fitness Tracker Pro',
        description: 'Advanced fitness tracker with comprehensive health monitoring',
        price: 199.99,
        status: ProductStatus.ACTIVE,
        created_at: '2025-01-10T09:00:00Z',
        updated_at: '2025-01-25T16:45:00Z',
        shop: { id: 1, name: 'EU Electronics Store', shortName: 'EU-ELEC', api_url: 'https://eu.example.com', prestashop_version: '8.1.0', status: 'ACTIVE' as any, created_at: '', updated_at: '' }
      }
    ],
    images: []
  },
  {
    id: 3,
    sku: 'DEMO-003',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable organic cotton t-shirt available in multiple colors and sizes.',
    category: 'Clothing',
    status: ProductStatus.DRAFT,
    version: 1,
    created_at: '2025-01-30T11:00:00Z',
    updated_at: '2025-01-30T11:00:00Z',
    // Enhanced features
    thumbnail: 'https://via.placeholder.com/64x64/FF9800/FFFFFF?text=TS',
    variants: [
      {
        id: 'var-3-1',
        name: 'White - S',
        sku: 'DEMO-003-WHT-S',
        price: 29.99,
        stock: 50,
        thumbnail: 'https://via.placeholder.com/48x48/FFFFFF/000000?text=S',
        attributes: [
          { name: 'Color', value: 'White' },
          { name: 'Size', value: 'S' }
        ]
      },
      {
        id: 'var-3-2',
        name: 'Black - M',
        sku: 'DEMO-003-BLK-M',
        price: 29.99,
        stock: 35,
        thumbnail: 'https://via.placeholder.com/48x48/000000/FFFFFF?text=M',
        attributes: [
          { name: 'Color', value: 'Black' },
          { name: 'Size', value: 'M' }
        ]
      },
      {
        id: 'var-3-3',
        name: 'Grey - L',
        sku: 'DEMO-003-GRY-L',
        price: 29.99,
        stock: 28,
        thumbnail: 'https://via.placeholder.com/48x48/808080/FFFFFF?text=L',
        attributes: [
          { name: 'Color', value: 'Grey' },
          { name: 'Size', value: 'L' }
        ]
      },
      {
        id: 'var-3-4',
        name: 'Navy - XL',
        sku: 'DEMO-003-NVY-XL',
        price: 32.99,
        stock: 18,
        thumbnail: 'https://via.placeholder.com/48x48/000080/FFFFFF?text=XL',
        attributes: [
          { name: 'Color', value: 'Navy' },
          { name: 'Size', value: 'XL' }
        ]
      }
    ],
    shops: [],
    categories: [
      {
        path: [
          { id: 'cat-6', name: 'Clothing', level: 1 },
          { id: 'cat-7', name: 'T-Shirts', level: 2 },
          { id: 'cat-8', name: 'Organic Cotton', level: 3 }
        ],
        breadcrumb: 'Fashion & Clothing > Men\'s Clothing > T-Shirts & Tops > Organic Cotton > Premium Quality'
      }
    ],
    syncStatus: {
      status: 'not_synced',
      lastSync: undefined,
      nextSync: undefined
    },
    lastSyncAt: undefined,
    shopData: [],
    images: []
  },
  {
    id: 4,
    sku: 'DEMO-004',
    name: 'Professional Camera Lens',
    description: 'High-performance camera lens for professional photography.',
    category: 'Photography',
    status: ProductStatus.INACTIVE,
    version: 1,
    created_at: '2025-01-05T14:00:00Z',
    updated_at: '2025-01-20T12:00:00Z',
    // Enhanced features
    thumbnail: 'https://via.placeholder.com/64x64/9C27B0/FFFFFF?text=CL',
    variants: [
      {
        id: 'var-4-1',
        name: '50mm f/1.8',
        sku: 'DEMO-004-50MM',
        price: 899.99,
        stock: 5,
        thumbnail: 'https://via.placeholder.com/48x48/9C27B0/FFFFFF?text=50',
        attributes: [
          { name: 'Focal Length', value: '50mm' },
          { name: 'Aperture', value: 'f/1.8' }
        ]
      }
    ],
    shops: [
      {
        shopId: '5',
        shopName: 'Photo Professional',
        shortName: 'PHOTO-PR',
        isActive: false,
        lastSync: new Date('2025-01-20T12:00:00Z'),
        syncStatus: 'inactive'
      }
    ],
    categories: [
      {
        path: [
          { id: 'cat-9', name: 'Photography', level: 1 },
          { id: 'cat-10', name: 'Camera Lenses', level: 2 },
          { id: 'cat-11', name: 'Prime Lenses', level: 3 }
        ],
        breadcrumb: 'Electronics > Photography Equipment > Camera Lenses > Prime Lenses > Professional Grade'
      }
    ],
    syncStatus: {
      status: 'error',
      differences: ['Connection timeout', 'Authentication failed'],
      lastSync: new Date('2025-01-20T12:00:00Z'),
      nextSync: new Date('2025-01-21T12:00:00Z')
    },
    lastSyncAt: new Date('2025-01-20T12:00:00Z'),
    shopData: [],
    images: []
  },
  {
    id: 5,
    sku: 'DEMO-005',
    name: 'Vintage Leather Wallet',
    description: 'Handcrafted vintage leather wallet with multiple compartments.',
    category: 'Accessories',
    status: ProductStatus.ARCHIVED,
    version: 3,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    // Enhanced features
    thumbnail: 'https://via.placeholder.com/64x64/795548/FFFFFF?text=WL',
    variants: [
      {
        id: 'var-5-1',
        name: 'Brown Leather',
        sku: 'DEMO-005-BRN',
        price: 89.99,
        stock: 0,
        thumbnail: 'https://via.placeholder.com/48x48/8B4513/FFFFFF?text=BR',
        attributes: [
          { name: 'Material', value: 'Leather' },
          { name: 'Color', value: 'Brown' }
        ]
      },
      {
        id: 'var-5-2',
        name: 'Black Leather',
        sku: 'DEMO-005-BLK',
        price: 94.99,
        stock: 0,
        thumbnail: 'https://via.placeholder.com/48x48/000000/FFFFFF?text=BL',
        attributes: [
          { name: 'Material', value: 'Leather' },
          { name: 'Color', value: 'Black' }
        ]
      }
    ],
    shops: [
      {
        shopId: '6',
        shopName: 'Vintage Accessories',
        shortName: 'VINTAGE',
        isActive: false,
        lastSync: new Date('2025-01-15T10:00:00Z'),
        syncStatus: 'inactive'
      }
    ],
    categories: [
      {
        path: [
          { id: 'cat-12', name: 'Accessories', level: 1 },
          { id: 'cat-13', name: 'Wallets', level: 2 },
          { id: 'cat-14', name: 'Leather Goods', level: 3 }
        ],
        breadcrumb: 'Fashion Accessories > Men\'s Accessories > Wallets & Money Clips > Leather Goods > Vintage Collection'
      }
    ],
    syncStatus: {
      status: 'not_synced',
      lastSync: new Date('2025-01-15T10:00:00Z'),
      nextSync: undefined
    },
    lastSyncAt: new Date('2025-01-15T10:00:00Z'),
    shopData: [],
    images: []
  }
];

// Mock API Service
export class MockApiService {
  private static delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async getProducts(params?: ProductListParams): Promise<ApiResponse<PaginatedResponse<EnhancedProduct>>> {
    await this.delay();
    
    let filteredProducts = [...mockEnhancedProducts];
    
    // Apply search filter
    if (params?.search) {
      const search = params.search.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search)
      );
    }
    
    // Apply status filter
    if (params?.status) {
      filteredProducts = filteredProducts.filter(product => product.status === params.status);
    }
    
    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 25;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedProducts = filteredProducts.slice(start, end);
    
    return {
      success: true,
      data: {
        data: paginatedProducts,
        pagination: {
          total: filteredProducts.length,
          page,
          limit,
          totalPages: Math.ceil(filteredProducts.length / limit),
          hasNext: end < filteredProducts.length,
          hasPrev: page > 1
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  static async getProduct(id: number): Promise<ApiResponse<EnhancedProduct>> {
    await this.delay();
    
    const product = mockEnhancedProducts.find(p => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    return {
      success: true,
      data: product,
      timestamp: new Date().toISOString()
    };
  }

  static async getProductStats(): Promise<ApiResponse<ProductStats>> {
    await this.delay();
    
    const stats: ProductStats = {
      total: mockEnhancedProducts.length,
      by_status: {
        [ProductStatus.ACTIVE]: mockEnhancedProducts.filter(p => p.status === ProductStatus.ACTIVE).length,
        [ProductStatus.DRAFT]: mockEnhancedProducts.filter(p => p.status === ProductStatus.DRAFT).length,
        [ProductStatus.INACTIVE]: mockEnhancedProducts.filter(p => p.status === ProductStatus.INACTIVE).length,
        [ProductStatus.ARCHIVED]: mockEnhancedProducts.filter(p => p.status === ProductStatus.ARCHIVED).length,
      },
      recent_count: mockEnhancedProducts.filter(p => {
        const created = new Date(p.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return created > thirtyDaysAgo;
      }).length,
      shops_count: 6 // Enhanced mock shops
    };
    
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };
  }

  static async createProduct(data: any): Promise<ApiResponse<EnhancedProduct>> {
    await this.delay();
    
    const newProduct: EnhancedProduct = {
      id: Math.max(...mockEnhancedProducts.map(p => p.id)) + 1,
      sku: data.sku,
      name: data.name,
      description: data.description,
      category: data.category,
      status: data.status || ProductStatus.DRAFT,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Enhanced features
      thumbnail: 'https://via.placeholder.com/64x64/607D8B/FFFFFF?text=NEW',
      variants: [],
      shops: [],
      categories: [],
      syncStatus: {
        status: 'not_synced',
        lastSync: undefined,
        nextSync: undefined
      },
      lastSyncAt: undefined,
      shopData: [],
      images: []
    };
    
    mockEnhancedProducts.push(newProduct);
    
    return {
      success: true,
      data: newProduct,
      timestamp: new Date().toISOString()
    };
  }

  static async updateProduct(id: number, data: any): Promise<ApiResponse<EnhancedProduct>> {
    await this.delay();
    
    const productIndex = mockEnhancedProducts.findIndex(p => p.id === id);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    
    mockEnhancedProducts[productIndex] = {
      ...mockEnhancedProducts[productIndex],
      ...data,
      updated_at: new Date().toISOString(),
      version: mockEnhancedProducts[productIndex].version + 1
    };
    
    return {
      success: true,
      data: mockEnhancedProducts[productIndex],
      timestamp: new Date().toISOString()
    };
  }

  static async deleteProduct(id: number): Promise<ApiResponse<void>> {
    await this.delay();
    
    const productIndex = mockEnhancedProducts.findIndex(p => p.id === id);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    
    mockEnhancedProducts.splice(productIndex, 1);
    
    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  }
}

// Helper function to determine if we should use mock data
export const shouldUseMockData = (): boolean => {
  return !localStorage.getItem('ppm_token') || import.meta.env.VITE_USE_MOCK_DATA === 'true';
};