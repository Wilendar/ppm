import { useState, useCallback } from 'react';
import { BulkSearchResponse, SKUSearchResult } from '../components/products/MultiSKUSearch';
import { EnhancedProduct, ProductStatus } from '../types/api.types';
import { shouldUseMockData } from '../services/mockApi';

// Mock data for testing
const mockProducts: EnhancedProduct[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    sku: 'DEMO-001',
    description: 'High-quality wireless headphones with noise cancellation',
    status: ProductStatus.ACTIVE,
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&crop=center',
    categories: [
      { id: '1', name: 'Electronics', parent_id: null },
      { id: '2', name: 'Audio', parent_id: '1' }
    ],
    variants: [
      {
        id: '1',
        name: 'Black',
        sku: 'DEMO-001-BLK',
        price: 299.99,
        stock_quantity: 45,
        attributes: { color: 'Black' }
      }
    ],
    shops: [
      { id: '1', name: 'Main Store', url: 'https://main.store.com', is_active: true },
      { id: '2', name: 'Mobile Store', url: 'https://mobile.store.com', is_active: true }
    ],
    syncStatus: {
      status: 'synced',
      last_sync: new Date('2024-01-15T10:30:00Z'),
      error_message: null
    },
    created_at: new Date('2024-01-01T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: '2',
    name: 'Smart Watch Series X',
    sku: 'DEMO-002',
    description: 'Advanced smartwatch with health monitoring',
    status: ProductStatus.ACTIVE,
    thumbnail: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=300&fit=crop&crop=center',
    categories: [
      { id: '1', name: 'Electronics', parent_id: null },
      { id: '3', name: 'Wearables', parent_id: '1' }
    ],
    variants: [
      {
        id: '2',
        name: '42mm Silver',
        sku: 'DEMO-002-42-SLV',
        price: 449.99,
        stock_quantity: 23,
        attributes: { size: '42mm', color: 'Silver' }
      },
      {
        id: '3',
        name: '46mm Black',
        sku: 'DEMO-002-46-BLK',
        price: 479.99,
        stock_quantity: 18,
        attributes: { size: '46mm', color: 'Black' }
      }
    ],
    shops: [
      { id: '1', name: 'Main Store', url: 'https://main.store.com', is_active: true }
    ],
    syncStatus: {
      status: 'synced',
      last_sync: new Date('2024-01-14T09:15:00Z'),
      error_message: null
    },
    created_at: new Date('2024-01-02T11:00:00Z'),
    updated_at: new Date('2024-01-14T09:15:00Z')
  },
  {
    id: '3',
    name: 'Gaming Mechanical Keyboard',
    sku: 'DEMO-003',
    description: 'RGB mechanical keyboard for gaming',
    status: ProductStatus.ACTIVE,
    thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop&crop=center',
    categories: [
      { id: '1', name: 'Electronics', parent_id: null },
      { id: '4', name: 'Gaming', parent_id: '1' }
    ],
    variants: [
      {
        id: '4',
        name: 'Blue Switches',
        sku: 'DEMO-003-BLUE',
        price: 129.99,
        stock_quantity: 67,
        attributes: { switch_type: 'Blue' }
      }
    ],
    shops: [
      { id: '2', name: 'Mobile Store', url: 'https://mobile.store.com', is_active: true }
    ],
    syncStatus: {
      status: 'pending',
      last_sync: new Date('2024-01-10T14:20:00Z'),
      error_message: null
    },
    created_at: new Date('2024-01-03T12:00:00Z'),
    updated_at: new Date('2024-01-13T16:45:00Z')
  },
  {
    id: '4',
    name: 'Wireless Mouse Pro',
    sku: 'DEMO-004',
    description: 'Professional wireless mouse with precision tracking',
    status: ProductStatus.ACTIVE,
    thumbnail: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop&crop=center',
    categories: [
      { id: '1', name: 'Electronics', parent_id: null },
      { id: '5', name: 'Accessories', parent_id: '1' }
    ],
    variants: [
      {
        id: '5',
        name: 'White',
        sku: 'DEMO-004-WHT',
        price: 79.99,
        stock_quantity: 89,
        attributes: { color: 'White' }
      }
    ],
    shops: [
      { id: '1', name: 'Main Store', url: 'https://main.store.com', is_active: true },
      { id: '2', name: 'Mobile Store', url: 'https://mobile.store.com', is_active: true }
    ],
    syncStatus: {
      status: 'error',
      last_sync: new Date('2024-01-12T08:10:00Z'),
      error_message: 'Connection timeout'
    },
    created_at: new Date('2024-01-04T13:00:00Z'),
    updated_at: new Date('2024-01-12T08:10:00Z')
  },
  {
    id: '5',
    name: 'USB-C Hub Multi-Port',
    sku: 'DEMO-005',
    description: '7-in-1 USB-C hub with multiple ports',
    status: ProductStatus.ACTIVE,
    thumbnail: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=300&fit=crop&crop=center',
    categories: [
      { id: '1', name: 'Electronics', parent_id: null },
      { id: '5', name: 'Accessories', parent_id: '1' }
    ],
    variants: [
      {
        id: '6',
        name: 'Space Gray',
        sku: 'DEMO-005-GRAY',
        price: 49.99,
        stock_quantity: 34,
        attributes: { color: 'Space Gray', ports: '7' }
      }
    ],
    shops: [
      { id: '1', name: 'Main Store', url: 'https://main.store.com', is_active: true }
    ],
    syncStatus: {
      status: 'synced',
      last_sync: new Date('2024-01-15T11:45:00Z'),
      error_message: null
    },
    created_at: new Date('2024-01-05T14:00:00Z'),
    updated_at: new Date('2024-01-15T11:45:00Z')
  }
];

export const useBulkSKUSearch = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Simulate fuzzy matching algorithm
  const calculateMatchScore = (searchSKU: string, productSKU: string, productName: string): number => {
    const searchUpper = searchSKU.toUpperCase();
    const skuUpper = productSKU.toUpperCase();
    const nameUpper = productName.toUpperCase();

    // Exact SKU match
    if (skuUpper === searchUpper) return 1.0;

    // SKU contains search term
    if (skuUpper.includes(searchUpper)) return 0.9;

    // Search term contains SKU
    if (searchUpper.includes(skuUpper)) return 0.8;

    // Check variant SKUs
    // (In real implementation, would check variant SKUs)

    // Name similarity (simple check)
    if (nameUpper.includes(searchUpper) || searchUpper.includes(nameUpper)) return 0.6;

    // Levenshtein distance or other string similarity
    // For demo, just return 0 for no match
    return 0;
  };

  // Find products matching SKU
  const findProductBySKU = (searchSKU: string): SKUSearchResult => {
    let bestMatch: EnhancedProduct | undefined;
    let bestScore = 0;

    // Search through all products
    for (const product of mockProducts) {
      // Check main SKU
      const mainScore = calculateMatchScore(searchSKU, product.sku, product.name);
      if (mainScore > bestScore) {
        bestMatch = product;
        bestScore = mainScore;
      }

      // Check variant SKUs
      if (product.variants) {
        for (const variant of product.variants) {
          const variantScore = calculateMatchScore(searchSKU, variant.sku, product.name);
          if (variantScore > bestScore) {
            bestMatch = product;
            bestScore = variantScore;
          }
        }
      }
    }

    // Determine status based on match score
    let status: SKUSearchResult['status'];
    if (bestScore >= 0.9) {
      status = 'found';
    } else if (bestScore >= 0.6) {
      status = 'partial_match';
    } else {
      status = 'not_found';
    }

    return {
      sku: searchSKU,
      status,
      product: bestMatch,
      searchQuery: searchSKU,
      timestamp: new Date(),
      matchScore: bestScore > 0 ? bestScore : undefined,
    };
  };

  // Bulk search function
  const bulkSearch = useCallback(async (
    skus: string[],
    onProgress?: (progress: number) => void
  ): Promise<BulkSearchResponse> => {
    if (!shouldUseMockData()) {
      // In production, this would call the actual API
      throw new Error('API not available in production mode');
    }

    setIsLoading(true);
    const startTime = Date.now();
    const results: SKUSearchResult[] = [];

    try {
      // Process SKUs in chunks to simulate real API behavior
      const chunkSize = 5;
      const chunks = [];
      
      for (let i = 0; i < skus.length; i += chunkSize) {
        chunks.push(skus.slice(i, i + chunkSize));
      }

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        
        // Process each SKU in the chunk
        for (const sku of chunk) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
          
          const result = findProductBySKU(sku);
          results.push(result);

          // Update progress
          const progress = ((chunkIndex * chunkSize + results.length % chunkSize) / skus.length) * 100;
          onProgress?.(progress);
        }
      }

      // Final progress update
      onProgress?.(100);

      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;

      // Calculate summary
      const found = results.filter(r => r.status === 'found').length;
      const notFound = results.filter(r => r.status === 'not_found').length;
      const partialMatches = results.filter(r => r.status === 'partial_match').length;

      const response: BulkSearchResponse = {
        results,
        summary: {
          total: skus.length,
          found,
          notFound,
          partialMatches,
          processingTime,
        },
        searchId: `search_${Date.now()}`,
      };

      return response;

    } catch (error) {
      console.error('Bulk search failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    bulkSearch,
    isLoading,
  };
};