import { describe, it, expect } from 'vitest';
import { mapInvoiceResponse, normalizeInvoiceStatus } from '../../lib/mappers/invoiceMapper';

describe('invoiceMapper', () => {
    describe('normalizeInvoiceStatus', () => {
        it('normalizes "paid" to "Paid"', () => {
            expect(normalizeInvoiceStatus('paid')).toBe('Paid');
            expect(normalizeInvoiceStatus('PAID')).toBe('Paid');
        });

        it('normalizes "draft" to "Draft"', () => {
            expect(normalizeInvoiceStatus('draft')).toBe('Draft');
        });

        it('normalizes "overdue" to "Overdue"', () => {
            expect(normalizeInvoiceStatus('overdue')).toBe('Overdue');
        });

        it('normalizes "unpaid" and "sent" to "Unpaid"', () => {
            expect(normalizeInvoiceStatus('unpaid')).toBe('Unpaid');
            expect(normalizeInvoiceStatus('sent')).toBe('Unpaid');
        });

        it('returns "Unpaid" for unknown status', () => {
            expect(normalizeInvoiceStatus('unknown')).toBe('Unpaid');
        });
    });

    describe('mapInvoiceResponse', () => {
        it('maps a backend invoice to frontend Invoice type', () => {
            const backendInvoice = {
                id: 'inv-123',
                invoice_number: 'INV-2024-001',
                invoice_date: '2024-01-15',
                due_date: '2024-02-15',
                client_id: '456',
                project_id: '789',
                client_name: 'John Doe',
                client_address: '123 Main St',
                items: [
                    { id: 'item-1', description: 'Photography', quantity: 1, unit_price: 500 },
                    { id: 'item-2', description: 'Editing', quantity: 2, unit_price: 100 },
                ],
                notes: 'Thank you for your business',
                subtotal: 700,
                tax: 70,
                total: 770,
                status: 'paid',
                template: 'modern',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-15T00:00:00Z',
            };

            const invoice = mapInvoiceResponse(backendInvoice as any);

            expect(invoice.id).toBe('inv-123');
            expect(invoice.invoiceNumber).toBe('INV-2024-001');
            expect(invoice.invoiceDate).toBe('2024-01-15');
            expect(invoice.dueDate).toBe('2024-02-15');
            expect(invoice.clientId).toBe('456');
            expect(invoice.projectId).toBe('789');
            expect(invoice.clientName).toBe('John Doe');
            expect(invoice.items).toHaveLength(2);
            expect(invoice.items[0].unitPrice).toBe(500);
            expect(invoice.subtotal).toBe(700);
            expect(invoice.tax).toBe(70);
            expect(invoice.total).toBe(770);
            expect(invoice.status).toBe('Paid');
            expect(invoice.template).toBe('modern');
        });

        it('generates item IDs when missing', () => {
            const backendInvoice = {
                id: 'inv-1',
                invoice_number: 'INV-001',
                invoice_date: '2024-01-01',
                due_date: '2024-02-01',
                client_name: 'Test',
                client_address: 'Address',
                items: [
                    { description: 'Service', quantity: 1, unit_price: 100 },
                ],
                subtotal: 100,
                tax: 10,
                total: 110,
                status: 'unpaid',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };

            const invoice = mapInvoiceResponse(backendInvoice as any);
            expect(invoice.items[0].id).toBe('inv-1-item-0');
        });

        it('uses default template when missing', () => {
            const backendInvoice = {
                id: 'inv-1',
                invoice_number: 'INV-001',
                invoice_date: '2024-01-01',
                due_date: '2024-02-01',
                client_name: 'Test',
                client_address: 'Address',
                items: [],
                subtotal: 0,
                tax: 0,
                total: 0,
                status: 'draft',
                template: null,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };

            const invoice = mapInvoiceResponse(backendInvoice as any);
            expect(invoice.template).toBe('modern');
        });
    });
});
