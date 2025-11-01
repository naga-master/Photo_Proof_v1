/**
 * Shopping Cart Service
 * Handles cart operations for clients
 */

import { apiClient } from '../lib/api-client';

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  photo_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  options?: any;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  client_id: string;
  project_id?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface AddToCartRequest {
  product_id: string;
  photo_id?: string;
  quantity: number;
  options?: any;
}

export interface UpdateCartItemRequest {
  quantity?: number;
  options?: any;
}

class CartService {
  /**
   * Get current user's cart
   */
  async getCart(): Promise<Cart> {
    return apiClient.get<Cart>('/v2/cart');
  }

  /**
   * Add item to cart
   */
  async addToCart(data: AddToCartRequest): Promise<Cart> {
    return apiClient.post<Cart>('/v2/cart/items', data);
  }

  /**
   * Update cart item quantity/options
   */
  async updateCartItem(itemId: string, data: UpdateCartItemRequest): Promise<Cart> {
    return apiClient.patch<Cart>(`/v2/cart/items/${itemId}`, data);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: string): Promise<Cart> {
    return apiClient.delete<Cart>(`/v2/cart/items/${itemId}`);
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    return apiClient.delete<void>('/v2/cart');
  }

  /**
   * Get cart summary (totals)
   */
  async getCartSummary(): Promise<{ subtotal: number; tax: number; total: number }> {
    return apiClient.get<{ subtotal: number; tax: number; total: number }>('/v2/cart/summary');
  }
}

export const cartService = new CartService();
