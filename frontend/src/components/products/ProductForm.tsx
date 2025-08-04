import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { Product, ProductStatus, CreateProductRequest, UpdateProductRequest, EnhancedProduct } from '../../types/api.types';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: EnhancedProduct; // If provided, we're editing; otherwise creating
}

// Validation schema
const createProductSchema = yup.object({
  sku: yup
    .string()
    .required('SKU is required')
    .min(2, 'SKU must be at least 2 characters')
    .max(50, 'SKU must be less than 50 characters')
    .matches(/^[A-Z0-9_-]+$/i, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  description: yup
    .string()
    .max(2000, 'Description must be less than 2000 characters'),
  category: yup
    .string()
    .max(100, 'Category must be less than 100 characters'),
  status: yup
    .mixed<ProductStatus>()
    .oneOf(Object.values(ProductStatus))
    .required('Status is required'),
});

const updateProductSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  description: yup
    .string()
    .max(2000, 'Description must be less than 2000 characters'),
  category: yup
    .string()
    .max(100, 'Category must be less than 100 characters'),
  status: yup
    .mixed<ProductStatus>()
    .oneOf(Object.values(ProductStatus))
    .required('Status is required'),
});

type FormData = CreateProductRequest | UpdateProductRequest;

const ProductForm: React.FC<ProductFormProps> = ({ open, onClose, product }) => {
  const isEditing = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const schema = isEditing ? updateProductSchema : createProductSchema;
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: isEditing
      ? {
          name: product.name,
          description: product.description || '',
          category: product.category || '',
          status: product.status,
        }
      : {
          sku: '',
          name: '',
          description: '',
          category: '',
          status: ProductStatus.DRAFT,
        },
    mode: 'onChange',
  });

  // Reset form when product changes or dialog opens
  React.useEffect(() => {
    if (open) {
      if (isEditing && product) {
        reset({
          name: product.name,
          description: product.description || '',
          category: product.category || '',
          status: product.status,
        });
      } else {
        reset({
          sku: '',
          name: '',
          description: '',
          category: '',
          status: ProductStatus.DRAFT,
        });
      }
    }
  }, [open, product, isEditing, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          data: data as UpdateProductRequest,
        });
      } else {
        await createProduct.mutateAsync(data as CreateProductRequest);
      }
      handleClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isLoading = createProduct.isPending || updateProduct.isPending;
  const error = createProduct.error || updateProduct.error;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Typography variant="h5">
          {isEditing ? 'Edit Product' : 'Create New Product'}
        </Typography>
        {isEditing && product && (
          <Typography variant="body2" color="text.secondary">
            SKU: {product.sku}
          </Typography>
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Error Alert */}
            {error && (
              <Alert severity="error">
                {error instanceof Error ? error.message : 'An error occurred'}
              </Alert>
            )}

            {/* SKU Field (only for creation) */}
            {!isEditing && (
              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SKU"
                    placeholder="Enter product SKU (e.g., PROD-001)"
                    error={!!errors.sku}
                    helperText={errors.sku?.message || 'Unique product identifier'}
                    fullWidth
                    required
                  />
                )}
              />
            )}

            {/* Name Field */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Product Name"
                  placeholder="Enter product name"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  fullWidth
                  required
                />
              )}
            />

            {/* Description Field */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  placeholder="Enter product description"
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  fullWidth
                  multiline
                  rows={4}
                />
              )}
            />

            {/* Category Field */}
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Category"
                  placeholder="Enter product category"
                  error={!!errors.category}
                  helperText={errors.category?.message}
                  fullWidth
                />
              )}
            />

            {/* Status Field */}
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    {...field}
                    label="Status"
                  >
                    <MenuItem value={ProductStatus.DRAFT}>Draft</MenuItem>
                    <MenuItem value={ProductStatus.ACTIVE}>Active</MenuItem>
                    <MenuItem value={ProductStatus.INACTIVE}>Inactive</MenuItem>
                    <MenuItem value={ProductStatus.ARCHIVED}>Archived</MenuItem>
                  </Select>
                  {errors.status && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.status.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleClose}
            disabled={isLoading}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : null}
          >
            {isLoading
              ? (isEditing ? 'Updating...' : 'Creating...')
              : (isEditing ? 'Update Product' : 'Create Product')
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductForm;