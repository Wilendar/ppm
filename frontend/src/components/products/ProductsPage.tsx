import React, { useState } from 'react';
import { Box } from '@mui/material';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import ProductDetails from './ProductDetails';
import MultiSKUSearch from './MultiSKUSearch';
import CSVImportWizard from './csvImport/CSVImportWizard';
import { Product, EnhancedProduct } from '../../types/api.types';
import { ImportResult } from '../../types/csvImport.types';

enum ModalType {
  NONE = 'NONE',
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  VIEW = 'VIEW',
  CSV_IMPORT = 'CSV_IMPORT',
}

const ProductsPage: React.FC = () => {
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null);

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setModalType(ModalType.CREATE);
  };

  const handleEditProduct = (product: EnhancedProduct) => {
    setSelectedProduct(product);
    setModalType(ModalType.EDIT);
  };

  const handleViewProduct = (product: EnhancedProduct) => {
    setSelectedProduct(product);
    setModalType(ModalType.VIEW);
  };

  const handleCloseModal = () => {
    setModalType(ModalType.NONE);
    setSelectedProduct(null);
  };

  const handleEditFromDetails = (product: EnhancedProduct) => {
    setSelectedProduct(product);
    setModalType(ModalType.EDIT);
  };

  const handleCSVImport = () => {
    setModalType(ModalType.CSV_IMPORT);
  };

  const handleImportComplete = (result: ImportResult) => {
    console.log('Import completed:', result);
    // In real app, refresh product list or show notification
    setModalType(ModalType.NONE);
  };

  return (
    <Box>
      {/* Multi-SKU Search */}
      <MultiSKUSearch
        onViewProduct={handleViewProduct}
        onEditProduct={handleEditProduct}
      />

      {/* Main Product List */}
      <ProductList
        onCreateProduct={handleCreateProduct}
        onEditProduct={handleEditProduct}
        onViewProduct={handleViewProduct}
        onCSVImport={handleCSVImport}
      />

      {/* Product Form Modal (Create/Edit) */}
      <ProductForm
        open={modalType === ModalType.CREATE || modalType === ModalType.EDIT}
        onClose={handleCloseModal}
        product={modalType === ModalType.EDIT ? selectedProduct : undefined}
      />

      {/* Product Details Modal */}
      <ProductDetails
        open={modalType === ModalType.VIEW}
        onClose={handleCloseModal}
        product={selectedProduct}
        onEdit={handleEditFromDetails}
      />

      {/* CSV Import Wizard */}
      {modalType === ModalType.CSV_IMPORT && (
        <CSVImportWizard
          onClose={handleCloseModal}
          onImportComplete={handleImportComplete}
        />
      )}
    </Box>
  );
};

export default ProductsPage;