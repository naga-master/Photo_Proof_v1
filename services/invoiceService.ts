/**
 * Invoice Service
 * Handles invoice generation and management
 */

import { apiClient } from '../lib/api-client';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  studio_id: string;
  client_id?: string | null;
  project_id?: string | null;
  invoice_number: string;
  status: string;
  invoice_date: string;
  due_date: string;
  client_name: string;
  client_address: string;
  items: InvoiceItem[];
  notes?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  template: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceRequest {
  client_id: string;
  project_id?: string;
  invoice_date: string;
  due_date: string;
  items: Array<Pick<InvoiceItem, 'description' | 'quantity' | 'unit_price'>>;
  notes?: string;
  template?: string;
  currency?: string;  // ISO 4217 code: "INR", "USD", etc.
  tax_rate?: number;  // Tax rate as decimal (0.18 for 18%)
}

export interface UpdateInvoiceRequest {
  status?: string;
  invoice_date?: string;
  due_date?: string;
  items?: Array<Pick<InvoiceItem, 'description' | 'quantity' | 'unit_price'>>;
  notes?: string;
  template?: string;
}

class InvoiceService {
  /**
   * Get all invoices for current studio
   */
  async getInvoices(status?: string, clientId?: string): Promise<Invoice[]> {
    const params: Record<string, string> = {};
    if (status) params.status_filter = status;
    if (clientId) params.client_id = clientId;
    
    return apiClient.get<Invoice[]>('/v2/invoices', params);
  }

  /**
   * Get single invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    return apiClient.get<Invoice>(`/v2/invoices/${invoiceId}`);
  }

  /**
   * Create new invoice
   */
  async createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
    return apiClient.post<Invoice>('/v2/invoices', data);
  }

  /**
   * Update invoice
   */
  async updateInvoice(invoiceId: string, data: UpdateInvoiceRequest): Promise<Invoice> {
    return apiClient.patch<Invoice>(`/v2/invoices/${invoiceId}`, data);
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceId: string): Promise<void> {
    return apiClient.delete<void>(`/v2/invoices/${invoiceId}`);
  }

  /**
   * Mark invoice as sent
   */
  async sendInvoice(invoiceId: string): Promise<Invoice> {
    return apiClient.post<Invoice>(`/v2/invoices/${invoiceId}/send`);
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(invoiceId: string, paidDate?: string): Promise<Invoice> {
    return apiClient.post<Invoice>(`/v2/invoices/${invoiceId}/pay`, {
      paid_date: paidDate || new Date().toISOString(),
    });
  }

  /**
   * Generate PDF invoice
   */
  async generateInvoicePDF(invoiceId: string): Promise<Blob> {
    const response = await fetch(`/v2/invoices/${invoiceId}/pdf`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    return response.blob();
  }
}

export const invoiceService = new InvoiceService();
