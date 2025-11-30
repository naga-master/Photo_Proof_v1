/**
 * Invoice Mapper
 * Transforms backend invoice responses to frontend Invoice type
 */

import type { Invoice, InvoiceTemplateId } from '../../types';
import type { Invoice as BackendInvoice } from '../../services/invoiceService';
import { getCurrencyConfig, DEFAULT_CURRENCY } from '../formatters/currency';

export const normalizeInvoiceStatus = (status: string): Invoice['status'] => {
    switch (status.toLowerCase()) {
        case 'paid':
            return 'Paid';
        case 'draft':
            return 'Draft';
        case 'overdue':
            return 'Overdue';
        case 'unpaid':
        case 'sent':
        default:
            return 'Unpaid';
    }
};

export const mapInvoiceResponse = (invoice: BackendInvoice): Invoice => {
    // Get currency config from backend currency code (e.g., "INR", "USD")
    const backendCurrency = (invoice as any).currency || 'INR';
    const currencyConfig = getCurrencyConfig(backendCurrency);
    
    return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        clientId: invoice.client_id ? String(invoice.client_id) : undefined,
        projectId: invoice.project_id ? String(invoice.project_id) : undefined,
        clientName: invoice.client_name,
        clientAddress: invoice.client_address,
        items: (invoice.items || []).map((item, index) => ({
            id: item.id ?? `${invoice.id}-item-${index}`,
            description: item.description,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
        })),
        notes: invoice.notes ?? undefined,
        subtotal: Number(invoice.subtotal),
        tax: Number(invoice.tax),
        taxRate: (invoice as any).tax_rate ? Number((invoice as any).tax_rate) : undefined,
        total: Number(invoice.total),
        currencySymbol: currencyConfig.symbol,
        status: normalizeInvoiceStatus(invoice.status),
        template: (invoice.template as InvoiceTemplateId) ?? 'modern',
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
    };
};
