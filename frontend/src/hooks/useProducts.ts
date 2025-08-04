import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Product, 
  ProductListParams, 
  CreateProductRequest, 
  UpdateProductRequest,
  ProductStats,
  QUERY_KEYS 
} from '../types/api.types';
import { productApi } from '../services/api';

// Get all products with filters and pagination
export const useProducts = (params?: ProductListParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, params],
    queryFn: () => productApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get single product by ID
export const useProduct = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.product(id),
    queryFn: () => productApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Get product by SKU
export const useProductBySku = (sku: string) => {
  return useQuery({
    queryKey: ['products', 'sku', sku],
    queryFn: () => productApi.getBySku(sku),
    enabled: !!sku,
    staleTime: 5 * 60 * 1000,
  });
};

// Get product statistics
export const useProductStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.productStats,
    queryFn: () => productApi.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest) => productApi.create(data),
    onSuccess: (response) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productStats });
      
      console.log('Product created successfully:', response.data);
    },
    onError: (error) => {
      console.error('Failed to create product:', error);
    },
  });
};

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRequest }) => 
      productApi.update(id, data),
    onSuccess: (response, variables) => {
      // Update specific product in cache
      queryClient.setQueryData(QUERY_KEYS.product(variables.id), response);
      
      // Invalidate products list to reflect changes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productStats });
      
      console.log('Product updated successfully:', response.data);
    },
    onError: (error) => {
      console.error('Failed to update product:', error);
    },
  });
};

// Delete product mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.product(id) });
      
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productStats });
      
      console.log('Product deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete product:', error);
    },
  });
};

// Bulk operations helper
export const useBulkProducts = () => {
  const queryClient = useQueryClient();

  const bulkDelete = useMutation({
    mutationFn: async (ids: number[]) => {
      const promises = ids.map(id => productApi.delete(id));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productStats });
    },
  });

  return {
    bulkDelete,
  };
};