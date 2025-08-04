import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowParams,
  GridPaginationModel,
} from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CloudUpload as CSVImportIcon,
} from '@mui/icons-material';
import { useProducts, useDeleteProduct } from '../../hooks/useProducts';
import { ProductStatus, ProductListParams, EnhancedProduct } from '../../types/api.types';
import { shouldUseMockData } from '../../services/mockApi';
import ProductThumbnail from './ProductThumbnail';
import VariantDropdown from './VariantDropdown';
import ShopBadges from './ShopBadges';
import CategoryBreadcrumb from './CategoryBreadcrumb';
import SyncStatusIndicator from './SyncStatusIndicator';

interface ProductListProps {
  onCreateProduct: () => void;
  onEditProduct: (product: EnhancedProduct) => void;
  onViewProduct: (product: EnhancedProduct) => void;
  onCSVImport?: () => void;
}

const ProductList: React.FC<ProductListProps> = ({
  onCreateProduct,
  onEditProduct,
  onViewProduct,
  onCSVImport,
}) => {
  // State for filters and pagination
  const [filters, setFilters] = useState<ProductListParams>({
    page: 1,
    limit: 25,
    search: '',
    status: undefined,
    sort: 'updated_at',
    order: 'desc',
  });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  // State for expanded variants
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  // API hooks
  const { data, isLoading, error, refetch } = useProducts(filters);
  const deleteProduct = useDeleteProduct();

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const search = event.target.value;
    setFilters(prev => ({ ...prev, search, page: 1 }));
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  // Handle status filter change
  const handleStatusChange = (status: ProductStatus | '') => {
    setFilters(prev => ({ 
      ...prev, 
      status: status || undefined, 
      page: 1 
    }));
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  // Handle pagination change
  const handlePaginationChange = (model: GridPaginationModel) => {
    setPaginationModel(model);
    setFilters(prev => ({
      ...prev,
      page: model.page + 1,
      limit: model.pageSize,
    }));
  };

  // Handle product deletion
  const handleDeleteProduct = async (product: EnhancedProduct) => {
    if (window.confirm(`Are you sure you want to delete product "${product.name}" (${product.sku})?`)) {
      try {
        await deleteProduct.mutateAsync(product.id);
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  // Status chip renderer
  const getStatusChip = (status: ProductStatus) => {
    const statusConfig = {
      [ProductStatus.ACTIVE]: { color: 'success' as const, label: 'Active' },
      [ProductStatus.INACTIVE]: { color: 'warning' as const, label: 'Inactive' },
      [ProductStatus.DRAFT]: { color: 'info' as const, label: 'Draft' },
      [ProductStatus.ARCHIVED]: { color: 'default' as const, label: 'Archived' },
    };

    const config = statusConfig[status];
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Enhanced DataGrid columns configuration with responsive behavior
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'thumbnail',
      headerName: '',
      width: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        if (params.row.isVariantRow) {
          return (
            <Box sx={{ pl: 4 }}>
              <ProductThumbnail
                src={params.row.variant?.thumbnail || 'https://via.placeholder.com/48x48/607D8B/FFFFFF?text=V'}
                productName={params.row.variant?.name || ''}
                size={40}
                showZoom={false}
              />
            </Box>
          );
        }
        return (
          <ProductThumbnail
            src={params.row.thumbnail}
            productName={params.row.name}
            size={48}
            showZoom={true}
          />
        );
      },
    },
    {
      field: 'productInfo',
      headerName: 'Product Info',
      width: 300,
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        if (params.row.isVariantRow) {
          return (
            <Box sx={{ pl: 4, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 1, color: 'text.secondary', fontSize: '0.9em' }}>└─</Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="medium" noWrap>
                  {params.row.variant?.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  fontFamily="monospace" 
                  fontSize="0.8em"
                >
                  {params.row.variant?.sku}
                </Typography>
                {params.row.variant?.attributes?.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {params.row.variant.attributes.slice(0, 2).map((attr: {name: string; value: string}, index: number) => (
                      <Chip
                        key={index}
                        label={`${attr.name}: ${attr.value}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65em', height: 18 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          );
        }
        return (
          <Box>
            <Typography variant="subtitle2" fontWeight="medium" noWrap>
              {params.row.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              fontFamily="monospace" 
              fontSize="0.8em"
            >
              {params.row.sku}
            </Typography>
            {params.row.description && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {params.row.description}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'variants',
      headerName: 'Variants',
      width: 140,
      sortable: false,
      renderCell: (params) => {
        if (params.row.isVariantRow) {
          return (
            <Typography variant="body2" color="text.secondary">
              Variant
            </Typography>
          );
        }
        return (
          <VariantDropdown
            variants={params.row.variants || []}
            productName={params.row.name}
            isExpanded={expandedProducts.has(params.row.id)}
            onToggleExpand={(expanded) => {
              const newExpanded = new Set(expandedProducts);
              if (expanded) {
                newExpanded.add(params.row.id);
              } else {
                newExpanded.delete(params.row.id);
              }
              setExpandedProducts(newExpanded);
            }}
          />
        );
      },
    },
    {
      field: 'categories',
      headerName: 'Categories',
      width: 200,
      sortable: false,
      hideable: true,
      renderCell: (params) => {
        if (params.row.isVariantRow) {
          return null; // Empty for variant rows
        }
        return (
          <CategoryBreadcrumb
            categories={params.row.categories || []}
            maxWidth={180}
            showAsChip={true}
            size="small"
          />
        );
      },
    },
    {
      field: 'shops',
      headerName: 'Shops',
      width: 220,
      minWidth: 200,
      sortable: false,
      renderCell: (params) => {
        if (params.row.isVariantRow) {
          // Show shops where this variant is available
          const parentShops = params.row.parentProduct?.shops || [];
          const activeShops = parentShops.filter((shop: {isActive: boolean}) => shop.isActive);
          return (
            <ShopBadges
              shops={activeShops}
              showAllLabels={true}
              maxLabelsPerLine={3}
              size="small"
            />
          );
        }
        return (
          <ShopBadges
            shops={params.row.shops || []}
            showAllLabels={true}
            maxLabelsPerLine={3}
            size="small"
          />
        );
      },
    },
    {
      field: 'priceRange',
      headerName: 'Price Range',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        if (params.row.isVariantRow) {
          const formatPrice = (price: number) => 
            new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'PLN',
              minimumFractionDigits: 0,
            }).format(price);
          
          const getStockColor = (stock: number) => {
            if (stock === 0) return 'error';
            if (stock < 10) return 'warning';
            return 'success';
          };
          
          return (
            <Box textAlign="right">
              <Typography variant="body2" fontWeight="medium">
                {formatPrice(params.row.variant?.price || 0)}
              </Typography>
              <Chip
                label={`Stock: ${params.row.variant?.stock || 0}`}
                size="small"
                color={getStockColor(params.row.variant?.stock || 0)}
                variant="filled"
                sx={{ mt: 0.5, fontSize: '0.65em', height: 20 }}
              />
            </Box>
          );
        }
        
        const variants = params.row.variants || [];
        if (variants.length === 0) return '-';
        
        const prices = variants.map((v: {price: number}) => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        const formatPrice = (price: number) => 
          new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
          }).format(price);
        
        if (minPrice === maxPrice) {
          return (
            <Typography variant="body2" fontWeight="medium">
              {formatPrice(minPrice)}
            </Typography>
          );
        }
        
        return (
          <Box textAlign="right">
            <Typography variant="body2" fontWeight="medium">
              {formatPrice(minPrice)} -
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatPrice(maxPrice)}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'syncStatus',
      headerName: 'Sync Status',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      hideable: true,
      renderCell: (params) => {
        if (params.row.isVariantRow) {
          return null; // Empty for variant rows
        }
        return (
          <SyncStatusIndicator
            syncStatus={params.row.syncStatus}
            productName={params.row.name}
            size="small"
            showLabel={false}
          />
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => {
        if (params.row.isVariantRow) {
          return null; // Empty for variant rows
        }
        return getStatusChip(params.value);
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: GridRowParams<EnhancedProduct>) => {
        if (params.row.isVariantRow) {
          return []; // No actions for variant rows
        }
        return [
          <GridActionsCellItem
            icon={
              <Tooltip title="View Details">
                <ViewIcon />
              </Tooltip>
            }
            label="View"
            onClick={() => onViewProduct(params.row)}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title="Edit Product">
                <EditIcon />
              </Tooltip>
            }
            label="Edit"
            onClick={() => onEditProduct(params.row)}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title="Delete Product">
                <DeleteIcon />
              </Tooltip>
            }
            label="Delete"
            onClick={() => handleDeleteProduct(params.row)}
            disabled={deleteProduct.isPending}
          />,
        ];
      },
    },
  ], [onViewProduct, onEditProduct, deleteProduct.isPending]);

  // Prepare data for DataGrid with expanded variants  
  const rows = useMemo(() => {
    const baseRows = data?.data?.data || [];
    const result: (EnhancedProduct | {id: string; isVariantRow: boolean; parentProductId: number; variant: EnhancedProduct['variants'][0]; parentProduct: EnhancedProduct; [key: string]: unknown})[] = [];
    
    baseRows.forEach((product) => {
      // Add main product row
      result.push(product);
      
      // Add variant rows if expanded
      if (expandedProducts.has(product.id) && product.variants?.length > 0) {
        product.variants.forEach((variant) => {
          result.push({
            id: `${product.id}-variant-${variant.id}`,
            isVariantRow: true,
            parentProductId: product.id,
            variant: variant,
            parentProduct: product,
            ...variant, // Spread variant properties for easier access
          });
        });
      }
    });
    
    return result;
  }, [data?.data?.data, expandedProducts]);
  
  const totalRows = data?.data?.pagination?.total || 0;

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load products. Please try again.
        </Alert>
        <Button variant="outlined" onClick={() => refetch()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Mock Data Warning */}
      {shouldUseMockData() && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            🎭 Demo Mode - Mock Data Active
          </Typography>
          <Typography variant="body2">
            You can create, edit, and delete products. Changes are temporary and will reset on page refresh.
          </Typography>
        </Alert>
      )}

      {/* Header with title and action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Products
        </Typography>
        <Stack direction="row" spacing={2}>
          {onCSVImport && (
            <Button
              variant="outlined"
              startIcon={<CSVImportIcon />}
              onClick={onCSVImport}
              size="large"
            >
              CSV Import
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateProduct}
            size="large"
          >
            Add Product
          </Button>
        </Stack>
      </Box>

      {/* Filters Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <TextField
              placeholder="Search products..."
              value={filters.search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />

            {/* Status Filter */}
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                label="Status"
                onChange={(e) => handleStatusChange(e.target.value as ProductStatus)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={ProductStatus.ACTIVE}>Active</MenuItem>
                <MenuItem value={ProductStatus.INACTIVE}>Inactive</MenuItem>
                <MenuItem value={ProductStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={ProductStatus.ARCHIVED}>Archived</MenuItem>
              </Select>
            </FormControl>

            {/* Refresh Button */}
            <IconButton
              onClick={() => refetch()}
              disabled={isLoading}
              sx={{ ml: 'auto' }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Enhanced Data Grid */}
      <Card>
        <Box sx={{ 
          height: { xs: 500, md: 700 }, 
          width: '100%',
          '& .MuiDataGrid-root': {
            // Mobile optimizations
            '@media (max-width: 900px)': {
              fontSize: '0.8rem',
            },
            '@media (max-width: 600px)': {
              fontSize: '0.75rem',
            },
          },
        }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationChange}
            paginationMode="server"
            rowCount={totalRows}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            disableColumnMenu
            hideFooterSelectedRowCount
            initialState={{
              columns: {
                columnVisibilityModel: {
                  // Hide less important columns on smaller screens
                  categories: true,
                  syncStatus: true,
                },
              },
            }}
            getRowHeight={(params) => {
              return params.model.isVariantRow ? 60 : 80;
            }}
            isRowSelectable={(params) => !params.row.isVariantRow}
            getRowClassName={(params) => {
              return params.row.isVariantRow ? 'variant-row' : 'product-row';
            }}
            componentsProps={{
              row: {
                'data-is-variant': (params: {row: {isVariantRow?: boolean}}) => params.row.isVariantRow || false,
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-main': {
                borderRadius: 0,
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
                paddingY: 1,
                transition: 'all 0.2s ease-in-out',
              },
              '& .MuiDataGrid-row': {
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'translateX(2px)',
                },
                // Variant row styling
                '&[data-is-variant="true"]': {
                  backgroundColor: 'action.hover',
                  borderLeft: '3px solid',
                  borderLeftColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                    transform: 'translateX(4px)',
                  },
                },
              },
              // Variant rows styling
              '& .variant-row': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                borderLeft: '3px solid',
                borderLeftColor: 'primary.light',
                animation: 'slideInFromLeft 0.3s ease-out',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  transform: 'translateX(4px)',
                },
              },
              // Product rows styling
              '& .product-row': {
                '&:hover': {
                  transform: 'translateX(2px)',
                },
              },
              '@keyframes slideInFromLeft': {
                '0%': {
                  opacity: 0,
                  transform: 'translateX(-20px) scale(0.95)',
                },
                '50%': {
                  opacity: 0.7,
                  transform: 'translateX(-5px) scale(0.98)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateX(0) scale(1)',
                },
              },
            }}
            slots={{
              loadingOverlay: () => (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ),
              noRowsOverlay: () => (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="text.secondary">
                    No products found. {filters.search && 'Try adjusting your search criteria.'}
                  </Typography>
                </Box>
              ),
            }}
          />
        </Box>
      </Card>
    </Box>
  );
};

export default ProductList;