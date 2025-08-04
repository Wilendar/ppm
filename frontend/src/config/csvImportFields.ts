import { PPMField } from '../types/csvImport.types';

// PPM Product Fields Configuration for CSV Import
export const PPM_FIELDS: PPMField[] = [
  {
    key: 'sku',
    label: 'SKU',
    type: 'text',
    required: true,
    description: 'Unique product identifier (alphanumeric, hyphens, underscores)',
    placeholder: 'e.g., HP-001, LAPTOP-DELL-XPS',
    validation: {
      pattern: /^[A-Z0-9\-_]+$/i,
      minLength: 2,
      maxLength: 50,
      unique: true
    }
  },
  {
    key: 'name',
    label: 'Product Name',
    type: 'text',
    required: true,
    description: 'Display name of the product',
    placeholder: 'e.g., Premium Wireless Headphones',
    validation: {
      minLength: 3,
      maxLength: 255
    }
  },
  {
    key: 'description',
    label: 'Description',
    type: 'text',
    required: false,
    description: 'Detailed product description (HTML supported)',
    placeholder: 'e.g., High-quality audio experience with noise cancellation...'
  },
  {
    key: 'shortDescription',
    label: 'Short Description',
    type: 'text',
    required: false,
    description: 'Brief product summary (plain text)',
    placeholder: 'e.g., Premium wireless headphones with ANC',
    validation: {
      maxLength: 500
    }
  },
  {
    key: 'price',
    label: 'Price',
    type: 'number',
    required: true,
    description: 'Product price (excluding tax)',
    placeholder: 'e.g., 299.99',
    validation: {
      min: 0.01,
      max: 999999.99
    }
  },
  {
    key: 'priceWithTax',
    label: 'Price with Tax',
    type: 'number',
    required: false,
    description: 'Product price including tax',
    placeholder: 'e.g., 359.99',
    validation: {
      min: 0.01,
      max: 999999.99
    }
  },
  {
    key: 'wholesalePrice',
    label: 'Wholesale Price',
    type: 'number',
    required: false,
    description: 'Wholesale/cost price',
    placeholder: 'e.g., 199.99',
    validation: {
      min: 0,
      max: 999999.99
    }
  },
  {
    key: 'category',
    label: 'Category',
    type: 'text',
    required: false,
    description: 'Product category (use > for hierarchy)',
    placeholder: 'e.g., Electronics > Audio > Headphones'
  },
  {
    key: 'brand',
    label: 'Brand',
    type: 'text',
    required: false,
    description: 'Product brand/manufacturer',
    placeholder: 'e.g., Sony, Apple, Samsung',
    validation: {
      maxLength: 100
    }
  },
  {
    key: 'manufacturer',
    label: 'Manufacturer',
    type: 'text',
    required: false,
    description: 'Product manufacturer (if different from brand)',
    placeholder: 'e.g., Foxconn for Apple products',
    validation: {
      maxLength: 100
    }
  },
  {
    key: 'supplier',
    label: 'Supplier',
    type: 'text',
    required: false,
    description: 'Product supplier/vendor',
    placeholder: 'e.g., Tech Distributor Ltd',
    validation: {
      maxLength: 100
    }
  },
  {
    key: 'stock',
    label: 'Stock Quantity',
    type: 'integer',
    required: false,
    description: 'Available stock quantity',
    placeholder: 'e.g., 100',
    validation: {
      min: 0,
      max: 999999
    }
  },
  {
    key: 'minStock',
    label: 'Minimum Stock',
    type: 'integer',
    required: false,
    description: 'Minimum stock level for alerts',
    placeholder: 'e.g., 10',
    validation: {
      min: 0,
      max: 999999
    }
  },
  {
    key: 'weight',
    label: 'Weight (kg)',
    type: 'number',
    required: false,
    description: 'Product weight in kilograms',
    placeholder: 'e.g., 0.5',
    validation: {
      min: 0,
      max: 99999.99
    }
  },
  {
    key: 'dimensions',
    label: 'Dimensions',
    type: 'text',
    required: false,
    description: 'Product dimensions (L x W x H in cm)',
    placeholder: 'e.g., 20 x 15 x 8'
  },
  {
    key: 'ean',
    label: 'EAN/Barcode',
    type: 'text',
    required: false,
    description: 'European Article Number or barcode',
    placeholder: 'e.g., 1234567890123',
    validation: {
      pattern: /^\d{8,14}$/
    }
  },
  {
    key: 'isbn',
    label: 'ISBN',
    type: 'text',
    required: false,
    description: 'International Standard Book Number (for books)',
    placeholder: 'e.g., 978-3-16-148410-0'
  },
  {
    key: 'mpn',
    label: 'MPN',
    type: 'text',
    required: false,
    description: 'Manufacturer Part Number',
    placeholder: 'e.g., WH-1000XM4',
    validation: {
      maxLength: 100
    }
  },
  {
    key: 'status',
    label: 'Status',
    type: 'enum',
    required: false,
    description: 'Product availability status',
    options: ['active', 'inactive', 'draft', 'discontinued'],
    validation: {
      enum: ['active', 'inactive', 'draft', 'discontinued']
    }
  },
  {
    key: 'visibility',
    label: 'Visibility',
    type: 'enum',
    required: false,
    description: 'Product visibility in catalog',
    options: ['everywhere', 'catalog', 'search', 'nowhere'],
    validation: {
      enum: ['everywhere', 'catalog', 'search', 'nowhere']
    }
  },
  {
    key: 'taxRule',
    label: 'Tax Rule',
    type: 'text',
    required: false,
    description: 'Tax rule identifier or name',
    placeholder: 'e.g., VAT 23%, Standard Tax'
  },
  {
    key: 'tags',
    label: 'Tags',
    type: 'array',
    required: false,
    description: 'Product tags (comma-separated)',
    placeholder: 'e.g., wireless, premium, bestseller'
  },
  {
    key: 'features',
    label: 'Features',
    type: 'array',
    required: false,
    description: 'Key product features (comma-separated)',
    placeholder: 'e.g., Bluetooth 5.0, 30h battery, ANC'
  },
  {
    key: 'color',
    label: 'Color',
    type: 'text',
    required: false,
    description: 'Primary product color',
    placeholder: 'e.g., Black, White, Red'
  },
  {
    key: 'size',
    label: 'Size',
    type: 'text',
    required: false,
    description: 'Product size',
    placeholder: 'e.g., M, Large, 42, One Size'
  },
  {
    key: 'material',
    label: 'Material',
    type: 'text',
    required: false,
    description: 'Primary product material',
    placeholder: 'e.g., Plastic, Metal, Cotton'
  },
  {
    key: 'condition',
    label: 'Condition',
    type: 'enum',
    required: false,
    description: 'Product condition',
    options: ['new', 'used', 'refurbished', 'damaged'],
    validation: {
      enum: ['new', 'used', 'refurbished', 'damaged']
    }
  },
  {
    key: 'warranty',
    label: 'Warranty (months)',
    type: 'integer',
    required: false,
    description: 'Warranty period in months',
    placeholder: 'e.g., 12, 24, 36',
    validation: {
      min: 0,
      max: 120
    }
  },
  {
    key: 'metaTitle',
    label: 'SEO Title',
    type: 'text',
    required: false,
    description: 'SEO meta title',
    placeholder: 'e.g., Premium Wireless Headphones - Best Audio Quality',
    validation: {
      maxLength: 160
    }
  },
  {
    key: 'metaDescription',
    label: 'SEO Description',
    type: 'text',
    required: false,
    description: 'SEO meta description',
    placeholder: 'e.g., Discover premium wireless headphones with exceptional audio quality...',
    validation: {
      maxLength: 320
    }
  },
  {
    key: 'availableDate',
    label: 'Available Date',
    type: 'date',
    required: false,
    description: 'Product availability date (YYYY-MM-DD)',
    placeholder: 'e.g., 2024-01-15'
  },
  {
    key: 'discontinueDate',
    label: 'Discontinue Date',
    type: 'date',
    required: false,
    description: 'Product discontinuation date (YYYY-MM-DD)',
    placeholder: 'e.g., 2025-12-31'
  }
];

// Field Groups for better organization
export const FIELD_GROUPS = {
  basic: {
    label: 'Basic Information',
    fields: ['sku', 'name', 'description', 'shortDescription']
  },
  pricing: {
    label: 'Pricing & Stock',
    fields: ['price', 'priceWithTax', 'wholesalePrice', 'stock', 'minStock']
  },
  categorization: {
    label: 'Categories & Classification',
    fields: ['category', 'brand', 'manufacturer', 'supplier', 'tags']
  },
  physical: {
    label: 'Physical Properties',
    fields: ['weight', 'dimensions', 'color', 'size', 'material']
  },
  identifiers: {
    label: 'Product Identifiers',
    fields: ['ean', 'isbn', 'mpn']
  },
  status: {
    label: 'Status & Visibility',
    fields: ['status', 'visibility', 'condition']
  },
  attributes: {
    label: 'Additional Attributes',
    fields: ['features', 'warranty', 'taxRule']
  },
  seo: {
    label: 'SEO & Marketing',
    fields: ['metaTitle', 'metaDescription']
  },
  dates: {
    label: 'Important Dates',
    fields: ['availableDate', 'discontinueDate']
  }
};

// Common field mappings for auto-detection
export const COMMON_FIELD_MAPPINGS: Record<string, string[]> = {
  sku: ['sku', 'product_code', 'item_code', 'article_number', 'part_number', 'code'],
  name: ['name', 'title', 'product_name', 'item_name', 'description', 'product_title'],
  description: ['description', 'long_description', 'details', 'product_description'],
  shortDescription: ['short_description', 'summary', 'brief', 'excerpt'],
  price: ['price', 'cost', 'amount', 'unit_price', 'selling_price', 'retail_price'],
  priceWithTax: ['price_with_tax', 'price_incl_tax', 'gross_price', 'final_price'],
  wholesalePrice: ['wholesale_price', 'cost_price', 'purchase_price', 'trade_price'],
  category: ['category', 'cat', 'product_category', 'type', 'group'],
  brand: ['brand', 'make', 'manufacturer', 'vendor', 'producer'],
  stock: ['stock', 'quantity', 'qty', 'available', 'inventory', 'stock_quantity'],
  weight: ['weight', 'mass', 'kg', 'grams', 'weight_kg'],
  ean: ['ean', 'barcode', 'ean13', 'gtin', 'upc'],
  status: ['status', 'state', 'active', 'enabled', 'visible'],
  tags: ['tags', 'keywords', 'labels', 'categories']
};

// Default import template
export const DEFAULT_TEMPLATE = {
  id: 'basic-product-import',
  name: 'Basic Product Import',
  description: 'Standard template for importing basic product information',
  fields: PPM_FIELDS.filter(field => 
    ['sku', 'name', 'description', 'price', 'category', 'stock', 'status', 'brand'].includes(field.key)
  ),
  sampleData: [
    {
      sku: 'DEMO-001',
      name: 'Premium Wireless Headphones',
      description: 'High-quality audio experience with active noise cancellation and 30-hour battery life.',
      price: '299.99',
      category: 'Electronics > Audio > Headphones',
      stock: '100',
      status: 'active',
      brand: 'Sony'
    },
    {
      sku: 'DEMO-002',
      name: 'Smart Fitness Tracker',
      description: 'Track your daily activities, heart rate, and sleep patterns with this advanced fitness tracker.',
      price: '199.99',
      category: 'Electronics > Wearables > Fitness',
      stock: '50',
      status: 'active',
      brand: 'Fitbit'
    },
    {
      sku: 'DEMO-003',
      name: 'Ergonomic Office Chair',
      description: 'Comfortable office chair with lumbar support and adjustable height for all-day productivity.',
      price: '449.99',
      category: 'Furniture > Office > Chairs',
      stock: '25',
      status: 'active',
      brand: 'Herman Miller'
    }
  ],
  version: '1.0',
  category: 'basic' as const
};