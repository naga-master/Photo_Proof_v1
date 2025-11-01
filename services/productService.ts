/**
 * Store/Products Service
 * Handles product catalog and store functionality
 */

import { apiClient } from '../lib/api-client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  product_type: 'print' | 'digital' | 'album' | 'frame' | 'canvas' | 'other';
  base_price: number;
  is_active: boolean;
  options?: ProductOption[];
  created_at: string;
  updated_at: string;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  price_modifier: number;
  is_default: boolean;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  product_type: string;
  base_price: number;
  options?: Omit<ProductOption, 'id' | 'product_id'>[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  base_price?: number;
  is_active?: boolean;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
}

class ProductService {
  /**
   * Get all products
   */
  async getProducts(productType?: string): Promise<ProductListResponse> {
    const params: Record<string, string> = {};
    if (productType) params.product_type = productType;
    
    return apiClient.get<ProductListResponse>('/v2/products', params);
  }

  /**
   * Get single product by ID
   */
  async getProduct(productId: string): Promise<Product> {
    return apiClient.get<Product>(`/v2/products/${productId}`);
  }

  /**
   * Create new product
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>('/v2/products', data);
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, data: UpdateProductRequest): Promise<Product> {
    return apiClient.patch<Product>(`/v2/products/${productId}`, data);
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: string): Promise<void> {
    return apiClient.delete<void>(`/v2/products/${productId}`);
  }

  /**
   * Get product options by type
   */
  async getProductOptionsByType(productType: string): Promise<ProductOption[]> {
    return apiClient.get<ProductOption[]>(`/v2/products/options/${productType}`);
  }
}

export const productService = new ProductService();
