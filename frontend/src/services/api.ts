import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  ApiResponse, 
  PaginatedResponse, 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductListParams,
  ProductStats 
} from '../types/api.types';
import { MockApiService, shouldUseMockData } from './mockApi';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api/v1';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('ppm_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (import.meta.env.DEV) {
          console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      (error: AxiosError) => {
        console.error('API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });

        // Handle authentication errors
        if (error.response?.status === 401) {
          localStorage.removeItem('ppm_token');
          // Redirect to login if needed
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic API methods
  private async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, { params });
    return response.data;
  }

  private async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data);
    return response.data;
  }

  private async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data);
    return response.data;
  }

  private async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url);
    return response.data;
  }

  // Product API methods
  async getProducts(params?: ProductListParams): Promise<ApiResponse<PaginatedResponse<Product>>> {
    if (shouldUseMockData()) {
      return MockApiService.getProducts(params);
    }
    return this.get('/products', params);
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    if (shouldUseMockData()) {
      return MockApiService.getProduct(id);
    }
    return this.get(`/products/${id}`);
  }

  async getProductBySku(sku: string): Promise<ApiResponse<Product>> {
    // Mock service doesn't support SKU lookup, fallback to regular API
    return this.get(`/products/sku/${sku}`);
  }

  async createProduct(data: CreateProductRequest): Promise<ApiResponse<Product>> {
    if (shouldUseMockData()) {
      return MockApiService.createProduct(data);
    }
    return this.post('/products', data);
  }

  async updateProduct(id: number, data: UpdateProductRequest): Promise<ApiResponse<Product>> {
    if (shouldUseMockData()) {
      return MockApiService.updateProduct(id, data);
    }
    return this.put(`/products/${id}`, data);
  }

  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    if (shouldUseMockData()) {
      return MockApiService.deleteProduct(id);
    }
    return this.delete(`/products/${id}`);
  }

  async getProductStats(): Promise<ApiResponse<ProductStats>> {
    if (shouldUseMockData()) {
      return MockApiService.getProductStats();
    }
    return this.get('/products/stats');
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.instance.get('/health');
    return response.data;
  }

  // API info
  async getApiInfo(): Promise<any> {
    const response = await this.instance.get('/api');
    return response.data;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export individual methods for easier use
export const productApi = {
  getAll: (params?: ProductListParams) => apiClient.getProducts(params),
  getById: (id: number) => apiClient.getProduct(id),
  getBySku: (sku: string) => apiClient.getProductBySku(sku),
  create: (data: CreateProductRequest) => apiClient.createProduct(data),
  update: (id: number, data: UpdateProductRequest) => apiClient.updateProduct(id, data),
  delete: (id: number) => apiClient.deleteProduct(id),
  getStats: () => apiClient.getProductStats(),
};