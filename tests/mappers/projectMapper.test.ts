import { describe, it, expect, vi } from 'vitest';
import { mapProjectToAlbum, normalizePaymentStatus } from '../../lib/mappers/projectMapper';

// Mock the projectService to avoid import issues
vi.mock('../../services/projectService', () => ({
    getCoverPhotoVariantUrl: vi.fn(() => '/mock-cover.jpg'),
}));

describe('projectMapper', () => {
    describe('normalizePaymentStatus', () => {
        it('returns undefined for null/undefined', () => {
            expect(normalizePaymentStatus(null)).toBeUndefined();
            expect(normalizePaymentStatus(undefined)).toBeUndefined();
        });

        it('normalizes "paid" to "Paid"', () => {
            expect(normalizePaymentStatus('paid')).toBe('Paid');
            expect(normalizePaymentStatus('PAID')).toBe('Paid');
        });

        it('normalizes "unpaid" to "Unpaid"', () => {
            expect(normalizePaymentStatus('unpaid')).toBe('Unpaid');
        });

        it('normalizes "due" and "overdue" to "Due"', () => {
            expect(normalizePaymentStatus('due')).toBe('Due');
            expect(normalizePaymentStatus('overdue')).toBe('Due');
        });

        it('returns undefined for unknown status', () => {
            expect(normalizePaymentStatus('unknown')).toBeUndefined();
        });
    });

    describe('mapProjectToAlbum', () => {
        it('maps a backend project to frontend Album type', () => {
            const backendProject = {
                id: '123',
                title: 'Test Project',
                client_id: '456',
                shoot_date: '2024-01-15',
                cover_photo_id: '789',
                cover_photo_src: '/covers/789.jpg',
                photo_count: 50,
                total_comments: 10,
                is_locked: false,
                layout: 'layout1',
                payment_status: 'paid',
                price: 1500,
                package_id: 'pkg-1',
                status: 'active',
                has_folders: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-15T00:00:00Z',
            };

            const album = mapProjectToAlbum(backendProject as any);

            expect(album.id).toBe('123');
            expect(album.title).toBe('Test Project');
            expect(album.clientId).toBe('456');
            expect(album.shootDate).toBe('2024-01-15');
            expect(album.coverPhotoId).toBe('789');
            expect(album.photoCount).toBe(50);
            expect(album.totalComments).toBe(10);
            expect(album.isLocked).toBe(false);
            expect(album.layout).toBe('layout1');
            expect(album.paymentStatus).toBe('Paid');
            expect(album.price).toBe(1500);
            expect(album.packageId).toBe('pkg-1');
            expect(album.status).toBe('active');
            expect(album.photos).toEqual([]);
            expect(album.folders).toEqual([]);
        });

        it('handles missing optional fields with defaults', () => {
            const minimalProject = {
                id: '1',
                title: null,
                client_id: null,
                photo_count: null,
                is_locked: null,
                status: 'draft',
                has_folders: false,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };

            const album = mapProjectToAlbum(minimalProject as any);

            expect(album.id).toBe('1');
            expect(album.title).toBe('Untitled Project');
            expect(album.clientId).toBe('');
            expect(album.photoCount).toBe(0);
            expect(album.isLocked).toBe(false);
            expect(album.folders).toBeUndefined();
        });
    });
});
