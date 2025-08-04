import React from 'react';
import { EnhancedProduct, DetailedProduct } from '../../types/api.types';
import ProductDetailLayout from './ProductDetailLayout';
import generateMockDetailedProduct from './MockDetailedProduct';

interface ProductDetailsProps {
  open: boolean;
  onClose: () => void;
  product: EnhancedProduct | null;
  onEdit?: (product: EnhancedProduct) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  open,
  onClose,
  product,
  onEdit,
}) => {
  if (!product) return null;

  // Convert EnhancedProduct to DetailedProduct with mock data
  const detailedProduct: DetailedProduct = generateMockDetailedProduct(product);

  const handleSave = (updatedProduct: DetailedProduct) => {
    console.log('Saving updated product:', updatedProduct);
    // Here you would normally call API to save changes
    // For now, just log the changes
  };

  const handleEdit = (updatedProduct: DetailedProduct) => {
    // Convert back to EnhancedProduct if needed
    onEdit?.(product);
  };

  return (
    <ProductDetailLayout
      open={open}
      onClose={onClose}
      product={detailedProduct}
      onSave={handleSave}
      onEdit={handleEdit}
    />
  );
};

export default ProductDetails;