import { 
  DetailedProduct, 
  DetailedProductImage, 
  CategorySelection, 
  DetailedShopData,
  DetailedVariant,
  ActivityEntry,
  DetailedSyncStatus,
  ProductMetadata,
  ProductStatus,
  ProductFeature
} from '../../types/api.types';

// Mock generator for DetailedProduct
export const generateMockDetailedProduct = (baseProduct: any): DetailedProduct => {
  const mockImages: DetailedProductImage[] = [
    {
      id: 1,
      product_id: baseProduct.id,
      filename: 'premium-headphones-main.jpg',
      alt_text: 'Premium Wireless Headphones - Main View',
      is_main: true,
      sort_order: 1,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      thumbnail_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop',
      file_size: 245760, // 240KB
      mime_type: 'image/jpeg',
    },
    {
      id: 2,
      product_id: baseProduct.id,
      filename: 'premium-headphones-side.jpg',
      alt_text: 'Premium Wireless Headphones - Side View',
      is_main: false,
      sort_order: 2,
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop',
      thumbnail_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&h=150&fit=crop',
      file_size: 189440, // 185KB
      mime_type: 'image/jpeg',
    },
    {
      id: 3,
      product_id: baseProduct.id,
      filename: 'premium-headphones-box.jpg',
      alt_text: 'Premium Wireless Headphones - Packaging',
      is_main: false,
      sort_order: 3,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop',
      thumbnail_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=150&h=150&fit=crop',
      file_size: 156672, // 153KB
      mime_type: 'image/jpeg',
    },
  ];

  const mockCategories: CategorySelection[] = [
    {
      level: 2,
      categoryId: '3',
      categoryName: 'Headphones',
      path: [
        { id: '1', name: 'Electronics', level: 0 },
        { id: '2', name: 'Audio Devices', level: 1 },
        { id: '3', name: 'Headphones', level: 2 }
      ],
      breadcrumb: 'Electronics > Audio Devices > Headphones',
    },
  ];

  const mockFeatures: ProductFeature[] = [
    {
      name: 'Battery Life',
      value: '30 hours',
      type: 'text',
      category: 'Technical Specs',
    },
    {
      name: 'Wireless Range',
      value: '10 meters',
      type: 'text',
      category: 'Technical Specs',
    },
    {
      name: 'Noise Cancelling',
      value: 'true',
      type: 'boolean',
      category: 'Features',
    },
    {
      name: 'Supported Codecs',
      value: 'SBC, AAC, aptX, LDAC',
      type: 'list',
      category: 'Audio',
    },
    {
      name: 'Weight',
      value: '250',
      type: 'number',
      category: 'Physical',
    },
  ];

  const mockVariants: DetailedVariant[] = [
    {
      id: 'var-1',
      name: 'Black - Premium',
      sku: 'DEMO-001-BLK',
      price: 299.99,
      stock: 15,
      status: ProductStatus.ACTIVE,
      attributes: [
        { name: 'Color', value: 'Black' },
        { name: 'Edition', value: 'Premium' },
      ],
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150'],
      shopSpecificData: [
        {
          shopId: 'shop-eu-elec',
          price: 299.99,
          stock: 15,
          isActive: true,
        },
        {
          shopId: 'shop-us-audio',
          price: 319.99,
          stock: 12,
          isActive: true,
        },
      ],
    },
    {
      id: 'var-2',
      name: 'White - Premium',
      sku: 'DEMO-001-WHT',
      price: 299.99,
      stock: 8,
      status: ProductStatus.ACTIVE,
      attributes: [
        { name: 'Color', value: 'White' },
        { name: 'Edition', value: 'Premium' },
      ],
      images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150'],
      shopSpecificData: [
        {
          shopId: 'shop-eu-elec',
          price: 299.99,
          stock: 8,
          isActive: true,
        },
        {
          shopId: 'shop-us-audio',
          price: 319.99,
          stock: 5,
          isActive: false,
        },
      ],
    },
  ];

  const mockShopData: DetailedShopData[] = [
    {
      id: 1,
      product_id: baseProduct.id,
      shop_id: 1,
      name: 'Premium Wireless Headphones - EU Version',
      description: 'High-quality wireless headphones with active noise cancellation. Perfect for music lovers and professionals.',
      short_description: 'Premium wireless headphones with ANC',
      price: 299.99,
      status: ProductStatus.ACTIVE,
      category_id: 15,
      meta_title: 'Premium Wireless Headphones | Best Audio Quality',
      meta_description: 'Experience superior sound quality with our premium wireless headphones. 30-hour battery, noise cancellation, and more.',
      tags: ['wireless', 'bluetooth', 'noise-cancelling', 'premium'],
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      shop: {
        id: 1,
        name: 'Electronics Europe',
        shortName: 'EU-ELEC',
        api_url: 'https://eu-electronics.example.com',
        prestashop_version: '8.1.0',
        status: 'ACTIVE' as any,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      pricing: {
        price: 299.99,
        sale_price: 279.99,
        currency: 'EUR',
        tax_rate: 21,
        price_with_tax: 362.99,
      },
      inventory: {
        stock_quantity: 23,
        low_stock_threshold: 5,
        track_quantity: true,
        allow_backorders: false,
      },
      customizations: {
        custom_name: 'Premium Wireless Headphones - EU Version',
        custom_description: 'High-quality wireless headphones with active noise cancellation. Perfect for music lovers and professionals.',
        custom_tags: ['wireless', 'bluetooth', 'noise-cancelling', 'premium', 'european'],
        custom_meta_title: 'Premium Wireless Headphones | Best Audio Quality - EU Store',
        custom_meta_description: 'Experience superior sound quality with our premium wireless headphones. 30-hour battery, noise cancellation, and more. EU warranty included.',
      },
      lastSyncDetails: {
        sync_id: 'sync-eu-001',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'success',
        changes_detected: [],
        error_message: undefined,
      },
    },
    {
      id: 2,
      product_id: baseProduct.id,
      shop_id: 2,
      name: 'Premium Wireless Headphones',
      description: 'Top-tier wireless headphones with noise cancellation technology.',
      short_description: 'Premium wireless headphones',
      price: 319.99,
      status: ProductStatus.ACTIVE,
      category_id: 22,
      meta_title: 'Premium Wireless Headphones | Audio Excellence',
      meta_description: 'Discover exceptional audio quality with premium wireless headphones. Advanced features for audiophiles.',
      tags: ['wireless', 'bluetooth', 'premium', 'usa'],
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      shop: {
        id: 2,
        name: 'US Audio Store',
        shortName: 'US-AUDIO',
        api_url: 'https://us-audio.example.com',
        prestashop_version: '9.0.0',
        status: 'ACTIVE' as any,
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      pricing: {
        price: 319.99,
        currency: 'USD',
        tax_rate: 8.5,
        price_with_tax: 347.19,
      },
      inventory: {
        stock_quantity: 17,
        low_stock_threshold: 3,
        track_quantity: true,
        allow_backorders: true,
      },
      customizations: {
        custom_name: 'Premium Wireless Headphones',
        custom_description: 'Top-tier wireless headphones with noise cancellation technology.',
        custom_tags: ['wireless', 'bluetooth', 'premium', 'usa', 'audiophile'],
      },
      lastSyncDetails: {
        sync_id: 'sync-us-002',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: 'warning',
        changes_detected: ['price_difference'],
        error_message: undefined,
      },
    },
    {
      id: 3,
      product_id: baseProduct.id,
      shop_id: 3,
      name: 'Premium Wireless Headphones - UK',
      description: 'Premium wireless headphones with superior sound quality.',
      short_description: 'Premium wireless headphones',
      price: 279.99,
      status: ProductStatus.INACTIVE,
      category_id: 18,
      meta_title: 'Premium Wireless Headphones | UK Tech Store',
      meta_description: 'High-quality wireless headphones available in the UK. Premium audio experience guaranteed.',
      tags: ['wireless', 'bluetooth', 'uk', 'premium'],
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      shop: {
        id: 3,
        name: 'UK Tech Store',
        shortName: 'UK-TECH',
        api_url: 'https://uk-tech.example.com',
        prestashop_version: '8.1.2',
        status: 'MAINTENANCE' as any,
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      pricing: {
        price: 279.99,
        currency: 'GBP',
        tax_rate: 20,
        price_with_tax: 335.99,
      },
      inventory: {
        stock_quantity: 5,
        low_stock_threshold: 10,
        track_quantity: true,
        allow_backorders: false,
      },
      customizations: {
        custom_name: 'Premium Wireless Headphones - UK',
        custom_description: 'Premium wireless headphones with superior sound quality.',
        custom_tags: ['wireless', 'bluetooth', 'uk', 'premium', 'british'],
      },
      lastSyncDetails: {
        sync_id: 'sync-uk-003',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'error',
        changes_detected: ['stock_low', 'shop_maintenance'],
        error_message: 'Shop is in maintenance mode, sync temporarily unavailable',
      },
    },
  ];

  const mockTimeline: ActivityEntry[] = [
    {
      id: 'activity-1',
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      action: 'created',
      description: 'Product created with basic information',
      actor: 'John Smith',
      details: { initial_sku: 'DEMO-001', initial_status: 'DRAFT' },
    },
    {
      id: 'activity-2',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      action: 'updated',
      description: 'Product images uploaded and descriptions added',
      actor: 'Sarah Johnson',
      details: { images_added: 3, descriptions_updated: true },
    },
    {
      id: 'activity-3',
      timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      action: 'updated',
      description: 'Product variants configured',
      actor: 'Mike Wilson',
      details: { variants_added: 2, attributes_configured: ['Color', 'Edition'] },
    },
    {
      id: 'activity-4',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      action: 'updated',
      description: 'Product status changed to ACTIVE',
      actor: 'John Smith',
      details: { status_changed: { from: 'DRAFT', to: 'ACTIVE' } },
    },
    {
      id: 'activity-5',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      action: 'exported',
      description: 'Product exported to EU Electronics store',
      actor: 'System',
      details: { shop_id: 1, export_format: 'prestashop_api' },
    },
    {
      id: 'activity-6',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      action: 'exported',
      description: 'Product exported to US Audio Store',
      actor: 'System',
      details: { shop_id: 2, export_format: 'prestashop_api' },
    },
    {
      id: 'activity-7',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      action: 'synced',
      description: 'Successful sync with all active shops',
      actor: 'System',
      details: { shops_synced: 2, sync_duration: 1250 },
    },
  ];

  const mockSyncStatus: DetailedSyncStatus = {
    status: 'differences',
    differences: ['Price difference in UK-TECH shop', 'Stock levels need updating'],
    lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nextSync: new Date(Date.now() + 4 * 60 * 60 * 1000),
    syncedShops: 2,
    totalShops: 3,
    lastSyncDuration: 1250,
    averageSyncTime: 1100,
    syncErrors: ['UK-TECH shop is in maintenance mode'],
  };

  const mockMetadata: ProductMetadata = {
    creator: 'John Smith',
    last_editor: 'Sarah Johnson',
    total_views: 127,
    export_count: 8,
    size_estimate: '2.1 MB',
  };

  return {
    ...baseProduct,
    images: mockImages,
    categories: mockCategories,
    descriptions: {
      short: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and superior audio quality.',
      long: `<h3>Experience Audio Excellence</h3>
      <p>Our Premium Wireless Headphones deliver an unparalleled audio experience with cutting-edge technology and premium materials.</p>
      
      <h4>Key Features:</h4>
      <ul>
        <li><strong>Active Noise Cancellation:</strong> Block out the world and focus on your music</li>
        <li><strong>30-Hour Battery Life:</strong> All-day listening without interruption</li>
        <li><strong>Premium Audio Codecs:</strong> Support for SBC, AAC, aptX, and LDAC</li>
        <li><strong>Comfortable Design:</strong> Soft ear cushions and adjustable headband</li>
        <li><strong>Quick Charge:</strong> 15 minutes charging = 3 hours playback</li>
      </ul>
      
      <p>Perfect for music enthusiasts, professionals, and anyone who values superior sound quality.</p>`,
      features: mockFeatures,
    },
    variants: mockVariants,
    shopData: mockShopData,
    timeline: mockTimeline,
    syncStatus: mockSyncStatus,
    metadata: mockMetadata,
  };
};

export default generateMockDetailedProduct;