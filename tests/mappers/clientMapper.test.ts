import { describe, it, expect } from 'vitest';
import { mapClientResponse } from '../../lib/mappers/clientMapper';

describe('clientMapper', () => {
    describe('mapClientResponse', () => {
        it('maps a backend client to frontend Client type', () => {
            const backendClient = {
                id: '123',
                name: 'John Doe',
                email: 'john@example.com',
                username: 'johndoe',
                phone: '+1234567890',
                address: '123 Main St',
                avatar_url: '/avatars/123.jpg',
                profile_picture: '/profiles/123.jpg',
                whatsapp_opt_in: true,
                email_opt_in: true,
                total_projects: 5,
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-15T00:00:00Z',
            };

            const client = mapClientResponse(backendClient as any);

            expect(client.id).toBe('123');
            expect(client.name).toBe('John Doe');
            expect(client.email).toBe('john@example.com');
            expect(client.username).toBe('johndoe');
            expect(client.phone).toBe('+1234567890');
            expect(client.address).toBe('123 Main St');
            expect(client.avatarUrl).toBe('/avatars/123.jpg');
            expect(client.whatsappOptIn).toBe(true);
            expect(client.emailOptIn).toBe(true);
            expect(client.totalProjects).toBe(5);
            expect(client.status).toBe('active');
        });

        it('uses email as username fallback', () => {
            const backendClient = {
                id: '1',
                name: 'Test',
                email: 'test@example.com',
                username: null,
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };

            const client = mapClientResponse(backendClient as any);
            expect(client.username).toBe('test@example.com');
        });

        it('handles missing optional fields', () => {
            const minimalClient = {
                id: '1',
                name: 'Test',
                email: 'test@example.com',
                is_active: false,
                created_at: '2024-01-01T00:00:00Z',
            };

            const client = mapClientResponse(minimalClient as any);

            expect(client.phone).toBeUndefined();
            expect(client.address).toBeUndefined();
            expect(client.avatarUrl).toBeNull();
            expect(client.status).toBe('inactive');
            expect(client.projects).toEqual([]);
        });
    });
});
