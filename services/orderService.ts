/**
 * Orders Service
 * Handles order creation and management
 */

import { apiClient } from '../lib/api-client';

export interface Order {
  id: string;
  client_id: string;
  project_id?: string;
  order_number: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  payment_method?: string;
  payment_date?: string;
  items: OrderItem[];
  shipping_address?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  photo_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  options?: any;
}

export interface CreateOrderRequest {
  project_id?: string;
  shipping_address?: any;
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_status?: 'unpaid' | 'paid' | 'refunded';
  payment_method?: string;
  notes?: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
}

class OrderService {
  /**
   * Get all orders for current user
   */
  async getOrders(status?: string): Promise<OrderListResponse> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    
    return apiClient.get<OrderListResponse>('/v2/orders', params);
  }

  /**
   * Get single order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    return apiClient.get<Order>(`/v2/orders/${orderId}`);
  }

  /**
   * Create order from cart
   */
  async createOrderFromCart(data: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>('/v2/orders/from-cart', data);
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, data: UpdateOrderRequest): Promise<Order> {
    return apiClient.patch<Order>(`/v2/orders/${orderId}`, data);
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    return apiClient.post<Order>(`/v2/orders/${orderId}/cancel`);
  }

  /**
   * Mark order as paid
   */
  async markOrderPaid(orderId: string, paymentMethod: string): Promise<Order> {
    return apiClient.post<Order>(`/v2/orders/${orderId}/pay`, {
      payment_method: paymentMethod,
    });
  }

  /**
   * Get order invoice/receipt
   */
  async getOrderInvoice(orderId: string): Promise<any> {
    return apiClient.get<any>(`/v2/orders/${orderId}/invoice`);
  }
}

export const orderService = new OrderService();
