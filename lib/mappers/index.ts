/**
 * Data Mappers
 * Centralized transformations from backend API responses to frontend types
 */

export { mapProjectToAlbum, normalizePaymentStatus } from './projectMapper';
export { mapClientResponse } from './clientMapper';
export { mapServicePackageResponse } from './packageMapper';
export { mapInvoiceResponse, normalizeInvoiceStatus } from './invoiceMapper';
